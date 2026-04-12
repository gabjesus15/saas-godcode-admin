"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface FloatingWhatsappButtonProps {
  phoneNumber: string;
  message?: string;
}

export function FloatingWhatsappButton({
  phoneNumber,
  message = "¡Hola! Me interesa conocer más sobre GodCode.",
}: FloatingWhatsappButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hacer visible después del montaje para evitar hidratación
    setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 sm:bottom-8 sm:right-8"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
