import React from "react";
import banksImg from "@/assets/images/banks.webp";

export const PaymentLogos = React.memo(() => (
  <div className="flex items-center justify-center mb-3">
    <img 
      src={banksImg} 
      alt="Accepted payment methods: Visa, Mastercard, American Express, Discover, Affirm, Klarna" 
      className="h-5 sm:h-6" 
    />
  </div>
));

PaymentLogos.displayName = 'PaymentLogos';