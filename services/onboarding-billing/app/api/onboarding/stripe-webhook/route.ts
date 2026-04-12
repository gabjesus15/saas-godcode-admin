import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { getStripeClient } from "../../../../lib/onboarding/stripe";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
    }

    const signature = req.headers.get("stripe-signature") || "";
    const rawBody = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Firma inválida" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const obj = event.data.object as {
        id?: string;
        payment_status?: string;
        metadata?: Record<string, string | undefined>;
      };

      const paymentReference = obj.id?.trim() || null;
      const companyId = obj.metadata?.company_id?.trim() || null;
      const onboardingApplicationId = obj.metadata?.onboarding_application_id?.trim() || null;

      if (paymentReference) {
        await supabaseAdmin.from("payments_history").update({
          status: "paid",
          payment_date: new Date().toISOString(),
        }).eq("payment_reference", paymentReference);
      }

      if (companyId) {
        await supabaseAdmin
          .from("companies")
          .update({ subscription_status: "active", updated_at: new Date().toISOString() })
          .eq("id", companyId);
      }

      if (onboardingApplicationId) {
        await supabaseAdmin
          .from("onboarding_applications")
          .update({ status: "payment_pending", updated_at: new Date().toISOString() })
          .eq("id", onboardingApplicationId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook error" },
      { status: 500 }
    );
  }
}
