'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Settings, Shield, Mail, Database, Zap, Globe, Bell, Key, Save, RefreshCw, AlertTriangle } from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerDay: number;
    defaultUserRole: string;
    sessionTimeout: number;
  };
  security: {
    enforcePasswordPolicy: boolean;
    minPasswordLength: number;
    requirePasswordSpecialChars: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    enableTwoFactor: boolean;
    allowedOrigins: string[];
    rateLimitEnabled: boolean;
    rateLimitRequestsPerMinute: number;
  };
  ai: {
    defaultModel: string;
    maxTokensPerRequest: number;
    maxRequestsPerUser: number;
    enableContentFiltering: boolean;
    crisisDetectionEnabled: boolean;
    crisisDetectionSensitivity: number;
    responseTimeoutSeconds: number;
    enablePersonalityPersistence: boolean;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    enableWelcomeEmails: boolean;
    enableNotificationEmails: boolean;
    enableMarketingEmails: boolean;
  };
  payments: {
    stripeEnabled: boolean;
    currency: string;
    taxEnabled: boolean;
    defaultTaxRate: number;
    trialPeriodDays: number;
    allowDowngrades: boolean;
    prorationEnabled: boolean;
  };
  notifications: {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSmsNotifications: boolean;
    adminAlertEmail: string;
    crisisAlertEmail: string;
    systemAlertThreshold: number;
  };
  analytics: {
    enableAnalytics: boolean;
    googleAnalyticsId: string;
    enableHotjar: boolean;
    hotjarId: string;
    enableMixpanel: boolean;
    mixpanelToken: string;
    dataRetentionDays: number;
  };
  backup: {
    enableAutoBackup: boolean;
    backupFrequency: string;
    backupRetentionDays: number;
    s3BackupEnabled: boolean;
    s3Bucket: string;
    lastBackupAt?: string;
  };
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    const isAdmin = session?.user?.email && (
      session.user.email === 'kouam7@gmail.com' || 
      session.user.role === 'ADMIN'
    );
    
    if (!session?.user || !isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      setSettings(data.settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch system settings',
        variant: 'destructive'
      });
      
      // Use mock settings as fallback
      setSettings(generateMockSettings());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchSettings();
    }
  }, [session]);

  // Update settings
  const handleUpdateSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) throw new Error('Failed to update settings');

      toast({
        title: 'Success',
        description: 'System settings updated successfully'
      });

      setHasChanges(false);
      fetchSettings(); // Refresh to get latest data
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update system settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Test email configuration
  const handleTestEmail = async () => {
    try {
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Email test failed');

      toast({
        title: 'Success',
        description: 'Test email sent successfully'
      });
    } catch (error) {
      console.error('Error testing email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      });
    }
  };

  // Trigger backup
  const handleBackupNow = async () => {
    try {
      const response = await fetch('/api/admin/settings/backup', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Backup failed');

      toast({
        title: 'Success',
        description: 'Backup initiated successfully'
      });

      fetchSettings(); // Refresh to update backup timestamp
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        variant: 'destructive'
      });
    }
  };

  // Update setting value
  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;

    setSettings(prev => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
          <Button onClick={fetchSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleUpdateSettings} disabled={saving || !hasChanges}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {loading && !settings ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : settings ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="general" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Backup
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxUsersPerDay">Max New Users Per Day</Label>
                    <Input
                      id="maxUsersPerDay"
                      type="number"
                      value={settings.general.maxUsersPerDay}
                      onChange={(e) => updateSetting('general', 'maxUsersPerDay', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.general.sessionTimeout}
                      onChange={(e) => updateSetting('general', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="maintenanceMode"
                      checked={settings.general.maintenanceMode}
                      onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                    />
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="registrationEnabled"
                      checked={settings.general.registrationEnabled}
                      onCheckedChange={(checked) => updateSetting('general', 'registrationEnabled', checked)}
                    />
                    <Label htmlFor="registrationEnabled">Enable User Registration</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                    <Input
                      id="minPasswordLength"
                      type="number"
                      value={settings.security.minPasswordLength}
                      onChange={(e) => updateSetting('security', 'minPasswordLength', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={settings.security.lockoutDuration}
                      onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rateLimitRequests">Rate Limit (requests/minute)</Label>
                    <Input
                      id="rateLimitRequests"
                      type="number"
                      value={settings.security.rateLimitRequestsPerMinute}
                      onChange={(e) => updateSetting('security', 'rateLimitRequestsPerMinute', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="allowedOrigins">Allowed Origins (one per line)</Label>
                  <Textarea
                    id="allowedOrigins"
                    value={settings.security.allowedOrigins.join('\n')}
                    onChange={(e) => updateSetting('security', 'allowedOrigins', e.target.value.split('\n').filter(Boolean))}
                    rows={4}
                    placeholder="https://yourdomain.com"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enforcePasswordPolicy"
                      checked={settings.security.enforcePasswordPolicy}
                      onCheckedChange={(checked) => updateSetting('security', 'enforcePasswordPolicy', checked)}
                    />
                    <Label htmlFor="enforcePasswordPolicy">Enforce Strong Password Policy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireSpecialChars"
                      checked={settings.security.requirePasswordSpecialChars}
                      onCheckedChange={(checked) => updateSetting('security', 'requirePasswordSpecialChars', checked)}
                    />
                    <Label htmlFor="requireSpecialChars">Require Special Characters in Passwords</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableTwoFactor"
                      checked={settings.security.enableTwoFactor}
                      onCheckedChange={(checked) => updateSetting('security', 'enableTwoFactor', checked)}
                    />
                    <Label htmlFor="enableTwoFactor">Enable Two-Factor Authentication</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="rateLimitEnabled"
                      checked={settings.security.rateLimitEnabled}
                      onCheckedChange={(checked) => updateSetting('security', 'rateLimitEnabled', checked)}
                    />
                    <Label htmlFor="rateLimitEnabled">Enable Rate Limiting</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultModel">Default AI Model</Label>
                    <Select
                      value={settings.ai.defaultModel}
                      onValueChange={(value) => updateSetting('ai', 'defaultModel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxTokens">Max Tokens Per Request</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={settings.ai.maxTokensPerRequest}
                      onChange={(e) => updateSetting('ai', 'maxTokensPerRequest', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxRequestsPerUser">Max Requests Per User/Hour</Label>
                    <Input
                      id="maxRequestsPerUser"
                      type="number"
                      value={settings.ai.maxRequestsPerUser}
                      onChange={(e) => updateSetting('ai', 'maxRequestsPerUser', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="responseTimeout">Response Timeout (seconds)</Label>
                    <Input
                      id="responseTimeout"
                      type="number"
                      value={settings.ai.responseTimeoutSeconds}
                      onChange={(e) => updateSetting('ai', 'responseTimeoutSeconds', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="crisisDetectionSensitivity">Crisis Detection Sensitivity</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm">Low</span>
                    <Input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={settings.ai.crisisDetectionSensitivity}
                      onChange={(e) => updateSetting('ai', 'crisisDetectionSensitivity', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm">High</span>
                    <Badge variant="outline">{(settings.ai.crisisDetectionSensitivity * 100).toFixed(0)}%</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableContentFiltering"
                      checked={settings.ai.enableContentFiltering}
                      onCheckedChange={(checked) => updateSetting('ai', 'enableContentFiltering', checked)}
                    />
                    <Label htmlFor="enableContentFiltering">Enable Content Filtering</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="crisisDetectionEnabled"
                      checked={settings.ai.crisisDetectionEnabled}
                      onCheckedChange={(checked) => updateSetting('ai', 'crisisDetectionEnabled', checked)}
                    />
                    <Label htmlFor="crisisDetectionEnabled">Enable Crisis Detection</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="personalityPersistence"
                      checked={settings.ai.enablePersonalityPersistence}
                      onCheckedChange={(checked) => updateSetting('ai', 'enablePersonalityPersistence', checked)}
                    />
                    <Label htmlFor="personalityPersistence">Enable Personality Persistence</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailProvider">Email Provider</Label>
                    <Select
                      value={settings.email.provider}
                      onValueChange={(value) => updateSetting('email', 'provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resend">Resend</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="smtp">Custom SMTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={settings.email.fromName}
                      onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                    />
                  </div>
                </div>

                {settings.email.provider === 'smtp' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          value={settings.email.smtpHost}
                          onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpUser">SMTP Username</Label>
                        <Input
                          id="smtpUser"
                          value={settings.email.smtpUser}
                          onChange={(e) => updateSetting('email', 'smtpUser', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="smtpSecure"
                          checked={settings.email.smtpSecure}
                          onCheckedChange={(checked) => updateSetting('email', 'smtpSecure', checked)}
                        />
                        <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableWelcomeEmails"
                      checked={settings.email.enableWelcomeEmails}
                      onCheckedChange={(checked) => updateSetting('email', 'enableWelcomeEmails', checked)}
                    />
                    <Label htmlFor="enableWelcomeEmails">Send Welcome Emails</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableNotificationEmails"
                      checked={settings.email.enableNotificationEmails}
                      onCheckedChange={(checked) => updateSetting('email', 'enableNotificationEmails', checked)}
                    />
                    <Label htmlFor="enableNotificationEmails">Send Notification Emails</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableMarketingEmails"
                      checked={settings.email.enableMarketingEmails}
                      onCheckedChange={(checked) => updateSetting('email', 'enableMarketingEmails', checked)}
                    />
                    <Label htmlFor="enableMarketingEmails">Send Marketing Emails</Label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleTestEmail} variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Settings */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={settings.payments.currency}
                      onValueChange={(value) => updateSetting('payments', 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="trialPeriodDays">Trial Period (days)</Label>
                    <Input
                      id="trialPeriodDays"
                      type="number"
                      value={settings.payments.trialPeriodDays}
                      onChange={(e) => updateSetting('payments', 'trialPeriodDays', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="defaultTaxRate"
                      type="number"
                      step="0.01"
                      value={settings.payments.defaultTaxRate}
                      onChange={(e) => updateSetting('payments', 'defaultTaxRate', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="stripeEnabled"
                      checked={settings.payments.stripeEnabled}
                      onCheckedChange={(checked) => updateSetting('payments', 'stripeEnabled', checked)}
                    />
                    <Label htmlFor="stripeEnabled">Enable Stripe Payments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="taxEnabled"
                      checked={settings.payments.taxEnabled}
                      onCheckedChange={(checked) => updateSetting('payments', 'taxEnabled', checked)}
                    />
                    <Label htmlFor="taxEnabled">Enable Tax Calculation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowDowngrades"
                      checked={settings.payments.allowDowngrades}
                      onCheckedChange={(checked) => updateSetting('payments', 'allowDowngrades', checked)}
                    />
                    <Label htmlFor="allowDowngrades">Allow Plan Downgrades</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="prorationEnabled"
                      checked={settings.payments.prorationEnabled}
                      onCheckedChange={(checked) => updateSetting('payments', 'prorationEnabled', checked)}
                    />
                    <Label htmlFor="prorationEnabled">Enable Proration</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminAlertEmail">Admin Alert Email</Label>
                    <Input
                      id="adminAlertEmail"
                      type="email"
                      value={settings.notifications.adminAlertEmail}
                      onChange={(e) => updateSetting('notifications', 'adminAlertEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crisisAlertEmail">Crisis Alert Email</Label>
                    <Input
                      id="crisisAlertEmail"
                      type="email"
                      value={settings.notifications.crisisAlertEmail}
                      onChange={(e) => updateSetting('notifications', 'crisisAlertEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="systemAlertThreshold">System Alert Threshold</Label>
                    <Input
                      id="systemAlertThreshold"
                      type="number"
                      value={settings.notifications.systemAlertThreshold}
                      onChange={(e) => updateSetting('notifications', 'systemAlertThreshold', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enablePushNotifications"
                      checked={settings.notifications.enablePushNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications', 'enablePushNotifications', checked)}
                    />
                    <Label htmlFor="enablePushNotifications">Enable Push Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableEmailNotifications"
                      checked={settings.notifications.enableEmailNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications', 'enableEmailNotifications', checked)}
                    />
                    <Label htmlFor="enableEmailNotifications">Enable Email Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableSmsNotifications"
                      checked={settings.notifications.enableSmsNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications', 'enableSmsNotifications', checked)}
                    />
                    <Label htmlFor="enableSmsNotifications">Enable SMS Notifications</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Settings */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Analytics Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                    <Input
                      id="googleAnalyticsId"
                      value={settings.analytics.googleAnalyticsId}
                      onChange={(e) => updateSetting('analytics', 'googleAnalyticsId', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hotjarId">Hotjar ID</Label>
                    <Input
                      id="hotjarId"
                      value={settings.analytics.hotjarId}
                      onChange={(e) => updateSetting('analytics', 'hotjarId', e.target.value)}
                      placeholder="1234567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mixpanelToken">Mixpanel Token</Label>
                    <Input
                      id="mixpanelToken"
                      value={settings.analytics.mixpanelToken}
                      onChange={(e) => updateSetting('analytics', 'mixpanelToken', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataRetentionDays">Data Retention (days)</Label>
                    <Input
                      id="dataRetentionDays"
                      type="number"
                      value={settings.analytics.dataRetentionDays}
                      onChange={(e) => updateSetting('analytics', 'dataRetentionDays', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAnalytics"
                      checked={settings.analytics.enableAnalytics}
                      onCheckedChange={(checked) => updateSetting('analytics', 'enableAnalytics', checked)}
                    />
                    <Label htmlFor="enableAnalytics">Enable Analytics Tracking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableHotjar"
                      checked={settings.analytics.enableHotjar}
                      onCheckedChange={(checked) => updateSetting('analytics', 'enableHotjar', checked)}
                    />
                    <Label htmlFor="enableHotjar">Enable Hotjar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableMixpanel"
                      checked={settings.analytics.enableMixpanel}
                      onCheckedChange={(checked) => updateSetting('analytics', 'enableMixpanel', checked)}
                    />
                    <Label htmlFor="enableMixpanel">Enable Mixpanel</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select
                      value={settings.backup.backupFrequency}
                      onValueChange={(value) => updateSetting('backup', 'backupFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="backupRetentionDays">Backup Retention (days)</Label>
                    <Input
                      id="backupRetentionDays"
                      type="number"
                      value={settings.backup.backupRetentionDays}
                      onChange={(e) => updateSetting('backup', 'backupRetentionDays', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="s3Bucket">S3 Bucket Name</Label>
                    <Input
                      id="s3Bucket"
                      value={settings.backup.s3Bucket}
                      onChange={(e) => updateSetting('backup', 's3Bucket', e.target.value)}
                      placeholder="my-backup-bucket"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    {settings.backup.lastBackupAt && (
                      <div>
                        <Label>Last Backup</Label>
                        <p className="text-sm text-gray-600">
                          {new Date(settings.backup.lastBackupAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAutoBackup"
                      checked={settings.backup.enableAutoBackup}
                      onCheckedChange={(checked) => updateSetting('backup', 'enableAutoBackup', checked)}
                    />
                    <Label htmlFor="enableAutoBackup">Enable Automatic Backups</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="s3BackupEnabled"
                      checked={settings.backup.s3BackupEnabled}
                      onCheckedChange={(checked) => updateSetting('backup', 's3BackupEnabled', checked)}
                    />
                    <Label htmlFor="s3BackupEnabled">Upload Backups to S3</Label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleBackupNow} variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No settings data available</p>
        </div>
      )}

      {/* Warning Notice */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="text-orange-800">
                You have unsaved changes. Make sure to save your settings before navigating away.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Mock settings generator
function generateMockSettings(): SystemSettings {
  return {
    general: {
      siteName: 'SoulBondAI',
      siteDescription: 'AI-powered relationship coaching and emotional support platform',
      supportEmail: 'support@soulbondai.com',
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerDay: 1000,
      defaultUserRole: 'USER',
      sessionTimeout: 60
    },
    security: {
      enforcePasswordPolicy: true,
      minPasswordLength: 8,
      requirePasswordSpecialChars: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableTwoFactor: false,
      allowedOrigins: ['https://soulbondai.com', 'https://www.soulbondai.com'],
      rateLimitEnabled: true,
      rateLimitRequestsPerMinute: 60
    },
    ai: {
      defaultModel: 'gpt-4',
      maxTokensPerRequest: 4096,
      maxRequestsPerUser: 50,
      enableContentFiltering: true,
      crisisDetectionEnabled: true,
      crisisDetectionSensitivity: 0.8,
      responseTimeoutSeconds: 30,
      enablePersonalityPersistence: true
    },
    email: {
      provider: 'resend',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpSecure: true,
      fromEmail: 'noreply@soulbondai.com',
      fromName: 'SoulBondAI',
      enableWelcomeEmails: true,
      enableNotificationEmails: true,
      enableMarketingEmails: false
    },
    payments: {
      stripeEnabled: true,
      currency: 'USD',
      taxEnabled: false,
      defaultTaxRate: 0,
      trialPeriodDays: 7,
      allowDowngrades: true,
      prorationEnabled: true
    },
    notifications: {
      enablePushNotifications: true,
      enableEmailNotifications: true,
      enableSmsNotifications: false,
      adminAlertEmail: 'admin@soulbondai.com',
      crisisAlertEmail: 'crisis@soulbondai.com',
      systemAlertThreshold: 10
    },
    analytics: {
      enableAnalytics: true,
      googleAnalyticsId: 'G-XXXXXXXXXX',
      enableHotjar: false,
      hotjarId: '',
      enableMixpanel: true,
      mixpanelToken: 'xxxxxxxxxxxxxxxxxxxx',
      dataRetentionDays: 365
    },
    backup: {
      enableAutoBackup: true,
      backupFrequency: 'daily',
      backupRetentionDays: 30,
      s3BackupEnabled: true,
      s3Bucket: 'soulbondai-backups',
      lastBackupAt: new Date().toISOString()
    }
  };
}