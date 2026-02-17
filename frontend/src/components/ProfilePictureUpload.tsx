import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { User, Upload, X } from 'lucide-react';

const ProfilePictureUpload = () => {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      // Note: You'll need to implement this endpoint in the backend
      // For now, we'll just show a success message
      // In a real implementation, you'd upload to a file storage service
      
      toast.success('Profile picture updated successfully!');
      // In production, you'd update the user's profile picture URL here
    } catch (error: any) {
      toast.error('Failed to upload profile picture', {
        description: error?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    // Reset file input
    const input = document.getElementById('profile-picture-input') as HTMLInputElement;
    if (input) input.value = '';
  };

  const getInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>Upload a profile picture for your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={preview || undefined} alt={user?.email || 'User'} />
            <AvatarFallback className="text-2xl">
              {preview ? <User className="w-12 h-12" /> : getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <label htmlFor="profile-picture-input">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={loading}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {preview ? 'Change Picture' : 'Upload Picture'}
                  </span>
                </Button>
              </label>
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            {preview && (
              <Button
                onClick={handleUpload}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Uploading...' : 'Save Picture'}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max size 5MB
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePictureUpload;

