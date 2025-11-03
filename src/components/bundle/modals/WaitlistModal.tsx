import React, { useState } from "react";
import { Product } from "@/types/bundle";
import { useWaitlistStatus } from "@/hooks/useWaitlistStatus";
import { Checkbox } from "@/components/ui/checkbox";
import secureParentingCourseImg from "@/assets/images/modal.png";

interface WaitlistModalProps {
  readonly isOpen: boolean;
  readonly product: Product;
  readonly onClose: () => void;
  readonly onSubmit?: (formData: WaitlistFormData) => void;
}

interface WaitlistFormData {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly termsAccepted: boolean;
  readonly marketingConsent: boolean;
}

export const WaitlistModal = React.memo<WaitlistModalProps>(
  ({ isOpen, product, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<WaitlistFormData>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      termsAccepted: false,
      marketingConsent: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addRegistration } = useWaitlistStatus();

    const handleInputChange = (
      field: keyof WaitlistFormData,
      value: string | boolean
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        // Send data to Supabase function which will handle the Zapier webhook
        const response = await fetch("https://chewhecvjmxxszapnxvp.supabase.co/functions/v1/submit-waitlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZXdoZWN2am14eHN6YXBueHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDk5MjgsImV4cCI6MjA3NDQyNTkyOH0.Ck8QoEmP0rJj3NEVt9GXbOE3juN_oPlvHnuXddgoWHc`,
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            product: product.title,
            productSku: product.sku,
            termsAccepted: formData.termsAccepted,
            marketingConsent: formData.marketingConsent,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        console.log("Waitlist form submitted successfully:", formData);

        // Save registration to localStorage
        addRegistration({
          productSku: product.sku,
          productTitle: product.title,
          email: formData.email,
        });

        // Call the onSubmit callback if provided
        onSubmit?.(formData);

        // Close modal after successful submission
        onClose();

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          termsAccepted: false,
          marketingConsent: false,
        });
      } catch (error) {
        console.error("Error submitting waitlist:", error);
        // You might want to show an error message to the user here
        alert("There was an error submitting your information. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-modal-title"
      >
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] lg:h-[720px] flex flex-col relative overflow-y-auto lg:overflow-y-hidden">
          {/* Close button (inside modal) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Left side - Image */}
            <div className="lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-0 h-48 lg:h-full overflow-hidden rounded-l-2xl">
              <img
                src={secureParentingCourseImg}
                alt="Secure Parenting Attachment Course"
                className="w-full h-full object-cover block"
              />
            </div>

            {/* Right side - Form */}
            <div className="lg:w-1/2 p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-full">
              <div className="max-w-md mx-auto w-full py-4">
                <h2
                  id="waitlist-modal-title"
                  className="font-besley text-[28px] sm:text-[32px] lg:text-[40px] font-[500] leading-[130%] tracking-[-0.04em] text-gray-900 mb-2"
                  style={{ verticalAlign: 'middle' }}
                >
                  Secure Parenting <br />
                  Attachment Course
                </h2>
                <p className="text-gray-600 mb-8">
                  Be the first to know when our Secure Parenting Attachment
                  Course launches. Get early access and special pricing.
                </p>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="">
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter your first name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter your last name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter your email address"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Terms and Conditions Checkbox */}
                  <div className="md:col-span-2">
                    <div className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) =>
                          handleInputChange("termsAccepted", checked === true)
                        }
                        required
                        className="mt-1"
                      />
                      <div className="space-y-1 leading-none">
                        <label className="text-sm text-gray-700">
                          I agree with the{" "}
                          <a
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-orange hover:underline font-medium"
                          >
                            Terms & Conditions
                          </a>{" "}
                          and{" "}
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-orange hover:underline font-medium"
                          >
                            Privacy Policy
                          </a>{" "}
                          *
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Marketing Consent Checkbox */}
                  <div className="md:col-span-2">
                    <div className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        checked={formData.marketingConsent}
                        onCheckedChange={(checked) =>
                          handleInputChange("marketingConsent", checked === true)
                        }
                        className="mt-1"
                      />
                      <div className="space-y-1 leading-none">
                        <label className="text-sm text-gray-700">
                          Let's stay in touch! Sign me up to receive exclusive offers and insights.
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.termsAccepted}
                      className="w-full bg-brand-orange hover:bg-brand-orange/90 disabled:bg-brand-orange/60 text-white font-semibold py-4 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
                    >
                      {isSubmitting ? "Joining Waitlist..." : "Get On Waitlist"}
                    </button>
                  </div>
                </form>


              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

WaitlistModal.displayName = "WaitlistModal";
