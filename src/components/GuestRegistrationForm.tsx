import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, User, AlertCircle, CheckCircle, MapPin } from "lucide-react";
import { typedSupabase, TABLES } from "@/lib/supabase-utils";
import { useToast } from "@/hooks/use-toast";

interface Panchayath {
  id: string;
  name: string;
  district: string;
  state: string;
}

export const GuestRegistrationForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    mobileNumber: '',
    panchayath_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPanchayaths = async () => {
      try {
        const { data, error } = await typedSupabase
          .from(TABLES.PANCHAYATHS)
          .select('id, name, district, state')
          .order('name');

        if (error) throw error;
        setPanchayaths(data || []);
      } catch (error) {
        console.error('Error fetching panchayaths:', error);
        toast({
          title: "Error",
          description: "Failed to load panchayaths",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPanchayaths();
  }, [toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.username.trim() || !formData.mobileNumber.trim() || !formData.panchayath_id) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      // Mobile number validation (basic)
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(formData.mobileNumber)) {
        toast({
          title: "Error", 
          description: "Please enter a valid 10-digit mobile number",
          variant: "destructive"
        });
        return;
      }

      // Submit registration request
      const { error } = await typedSupabase
        .from(TABLES.USER_REGISTRATION_REQUESTS)
        .insert({
          username: formData.username.trim(),
          mobile_number: formData.mobileNumber,
          panchayath_id: formData.panchayath_id,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Error",
            description: "Username or mobile number already exists",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      setIsSubmitted(true);
      toast({
        title: "Success",
        description: "Registration request submitted successfully!"
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Failed to submit registration request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Request Submitted</CardTitle>
          <CardDescription>
            Your registration request has been submitted and is pending admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You will be notified once your account is approved by an administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Guest Registration</CardTitle>
        <CardDescription>
          Request access to the system. Your request will be reviewed by an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="pl-10"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.mobileNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                className="pl-10"
                maxLength={10}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="panchayath">Panchayath</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
              <Select 
                value={formData.panchayath_id} 
                onValueChange={(value) => setFormData(prev => ({...prev, panchayath_id: value}))}
                disabled={loading || isSubmitting}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder={loading ? "Loading panchayaths..." : "Select panchayath"} />
                </SelectTrigger>
                <SelectContent>
                  {panchayaths.map((panchayath) => (
                    <SelectItem key={panchayath.id} value={panchayath.id}>
                      {panchayath.name} - {panchayath.district}, {panchayath.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};