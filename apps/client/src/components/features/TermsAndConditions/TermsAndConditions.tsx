import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@chronicles-vault/ui';
import { Button } from '@chronicles-vault/ui';

const TERMS_ACCEPTANCE_KEY = 'cv_terms_accepted';
const TERMS_VERSION = '1.0';

interface TermsAndConditionsProps {
  onAccept: () => void;
}

export function TermsAndConditions({ onAccept }: TermsAndConditionsProps) {
  const [hasAccepted, setHasAccepted] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TERMS_ACCEPTANCE_KEY);
      setHasAccepted(stored === TERMS_VERSION);
    }
  }, []);

  const handleAccept = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TERMS_ACCEPTANCE_KEY, TERMS_VERSION);
      setHasAccepted(true);
      onAccept();
    }
  }, [onAccept]);

  const handleDecline = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = 'about:blank';
    }
  }, []);

  if (hasAccepted === null || hasAccepted === true) {
    return null;
  }

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read and accept the terms to use Chronicles Vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 text-sm">
          <section>
            <h3 className="font-semibold text-lg mb-2">1. Data Ownership and Privacy</h3>
            <p className="text-muted-foreground mb-2">
              Chronicles Vault is a local-first application. Your data is stored on your device and remains under your control. We do not collect, transmit, or sell your personal reading data, memories, or any other content stored in the application.
            </p>
            <p className="text-muted-foreground">
              Any cloud synchronization features are entirely optional and require explicit user configuration. When enabled, you maintain full control over what data is synchronized.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">2. Usage and Responsibilities</h3>
            <p className="text-muted-foreground mb-2">
              Chronicles Vault is designed to help you organize and track your personal reading and fiction consumption. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Ensuring you have legal access to any content you track or reference</li>
              <li>Complying with copyright laws and content provider terms of service</li>
              <li>Not using the application to circumvent DRM, anti-bot systems, or access controls</li>
              <li>Respecting the intellectual property rights of content creators</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">3. No Credential Syncing</h3>
            <p className="text-muted-foreground">
              Chronicles Vault will never synchronize your login credentials, passwords, or authentication tokens for third-party services. Integration with external services (when implemented) will use standard OAuth or API tokens that you explicitly authorize. These credentials are stored locally and never transmitted to our servers.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">4. Security and Vault</h3>
            <p className="text-muted-foreground mb-2">
              The Vault feature uses AES-256-GCM encryption with Argon2id key derivation to protect your sensitive data. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Keeping your Vault passphrase secure and memorable</li>
              <li>Understanding that lost passphrases cannot be recovered</li>
              <li>Maintaining backups of your encrypted data</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">5. No Warranties</h3>
            <p className="text-muted-foreground">
              Chronicles Vault is provided "as is" without warranties of any kind, express or implied. We are not responsible for data loss, though we provide export and backup features to help you protect your data.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">6. Future Changes</h3>
            <p className="text-muted-foreground">
              These terms may be updated in future versions. Significant changes will be clearly communicated, and you will be asked to re-accept the terms if they are materially modified.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">7. Web/PWA Usage</h3>
            <p className="text-muted-foreground">
              When using Chronicles Vault as a web application or Progressive Web App (PWA), the same privacy and data ownership principles apply. Your data remains stored locally in your browser, and no server-side data collection occurs unless you explicitly configure optional cloud sync.
            </p>
          </section>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleDecline}>
            Decline
          </Button>
          <Button onClick={handleAccept}>
            Accept Terms
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
