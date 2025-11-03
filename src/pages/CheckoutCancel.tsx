import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';

const CheckoutCancel = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-besley text-brand-blue-gray mb-2">
                Payment Cancelled
              </CardTitle>
              <CardDescription className="text-lg text-neutral-600">
                No worries! Your payment was cancelled and no charges were made.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-neutral-50 rounded-lg p-4">
                <h3 className="font-medium text-brand-blue-gray mb-2">What happened?</h3>
                <p className="text-sm text-neutral-600">
                  You chose to cancel the payment process. Your cart is still saved and ready when you want to continue.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <ArrowLeft className="w-5 h-5 text-brand-orange mt-0.5" />
                  <div>
                    <h3 className="font-medium text-brand-blue-gray">Continue Building Your Bundle</h3>
                    <p className="text-sm text-neutral-600">
                      Return to the bundle builder to add more courses or adjust your selection.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-brand-orange mt-0.5" />
                  <div>
                    <h3 className="font-medium text-brand-blue-gray">Need Help?</h3>
                    <p className="text-sm text-neutral-600">
                      Our support team is here to help with any questions about our courses or the checkout process.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1">
                    <Link to="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Return to Bundle Builder
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <a href="mailto:support@yourdomain.com">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Support
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;