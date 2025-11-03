// Admin component for managing payment methods (future use)
import React, { useState } from 'react';
import { 
  PAYMENT_METHODS, 
  togglePaymentMethod, 
  getAvailablePaymentMethods,
  PaymentMethodConfig 
} from '@/utils/paymentMethods';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentMethodManagerProps {
  readonly isAdmin?: boolean;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ isAdmin = false }) => {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>(PAYMENT_METHODS);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedCurrency, setSelectedCurrency] = useState('usd');

  const handleToggle = (methodId: string, enabled: boolean) => {
    if (!isAdmin) return;
    
    togglePaymentMethod(methodId, enabled);
    setMethods([...PAYMENT_METHODS]); // Trigger re-render
  };

  const availableForLocation = getAvailablePaymentMethods(selectedCountry, selectedCurrency);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div>
          <label className="text-sm font-medium">Test Country:</label>
          <select 
            value={selectedCountry} 
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
            <option value="NL">Netherlands</option>
            <option value="AU">Australia</option>
            <option value="JP">Japan</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Currency:</label>
          <select 
            value={selectedCurrency} 
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="ml-2 border rounded px-2 py-1"
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
            <option value="cad">CAD</option>
            <option value="aud">AUD</option>
            <option value="jpy">JPY</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Payment Methods</CardTitle>
            <CardDescription>
              Methods available for {selectedCountry} in {selectedCurrency.toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableForLocation.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-xs text-gray-600">{method.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={method.external ? "secondary" : "default"}>
                      {method.external ? "External" : "Stripe"}
                    </Badge>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      P{method.priority}
                    </span>
                  </div>
                </div>
              ))}
              {availableForLocation.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No payment methods available for this location
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Payment Methods</CardTitle>
            <CardDescription>
              Global configuration {isAdmin && "(Admin View)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {methods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {method.name}
                      <Badge variant={method.enabled ? "default" : "secondary"}>
                        {method.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {method.external && (
                        <Badge variant="outline">External</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">{method.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Countries: {method.countries.length === 0 ? "All" : method.countries.slice(0, 3).join(", ")}
                      {method.countries.length > 3 && ` +${method.countries.length - 3} more`}
                    </div>
                  </div>
                  {isAdmin && (
                    <Switch
                      checked={method.enabled}
                      onCheckedChange={(enabled) => handleToggle(method.id, enabled)}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Integration Guide</CardTitle>
          <CardDescription>How to add new payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Adding Stripe Payment Methods:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Add the method to PAYMENT_METHODS array in paymentMethods.ts</li>
                <li>Set the correct stripePaymentMethod value</li>
                <li>Configure country and currency restrictions</li>
                <li>Set enabled: true</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Adding External Payment Methods (PayPal, etc.):</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Add the method with external: true</li>
                <li>Implement the payment flow in the checkout component</li>
                <li>Handle the success/failure callbacks</li>
                <li>Update the order status via your backend</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};