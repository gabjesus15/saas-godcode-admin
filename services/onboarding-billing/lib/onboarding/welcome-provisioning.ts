import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { sendOnboardingEmail } from "./emails";

type OnboardingApp = {
	id: string;
	email: string;
	responsible_name: string | null;
	business_name: string | null;
};

export class WelcomeProvisioningError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

export async function provisionOnboardingWelcome(params: {
	supabaseAdmin: SupabaseClient;
	application: OnboardingApp;
	companyId: string;
	resendApiKey: string;
	resendFrom: string;
}): Promise<void> {
	const { supabaseAdmin, application, companyId, resendApiKey, resendFrom } = params;
	const tempPassword = randomBytes(16).toString("hex");

	const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
		email: application.email,
		password: tempPassword,
		email_confirm: true,
	});

	if (authError) {
		throw new WelcomeProvisioningError(authError.message || "Error al crear usuario", 400);
	}

	const authUserId = authUser.user?.id;
	if (!authUserId) {
		throw new WelcomeProvisioningError("Usuario de auth no creado", 500);
	}

	const { error: userInsertError } = await supabaseAdmin.from("users").insert({
		email: application.email,
		role: "ceo",
		company_id: companyId,
		branch_id: null,
		auth_user_id: authUserId,
		auth_id: authUserId,
	});

	if (userInsertError) {
		throw new WelcomeProvisioningError(
			userInsertError.message || "Error al vincular usuario",
			500
		);
	}

	const linkResult = await supabaseAdmin.auth.admin.generateLink({
		type: "recovery",
		email: application.email,
	});
	const magicLink = (linkResult.data as { properties?: { action_link?: string } })?.properties
		?.action_link;
	const fallbackUrl = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
		? `${process.env.NEXT_PUBLIC_TENANT_PROTOCOL || "https"}://${process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN}`
		: "http://localhost:3001";
	const panelUrl = magicLink || fallbackUrl;

	await sendOnboardingEmail({
		type: "welcome",
		to: application.email,
		from: resendFrom,
		apiKey: resendApiKey,
		responsibleName: application.responsible_name ?? "",
		businessName: application.business_name ?? "",
		panelUrl,
	});

	await supabaseAdmin
		.from("onboarding_applications")
		.update({
			status: "active",
			welcome_email_sent_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.eq("id", application.id);
}
