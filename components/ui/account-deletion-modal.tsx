'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isLoading: boolean;
  username: string;
}

export function AccountDeletionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  username
}: AccountDeletionModalProps) {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1);

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setConfirmText('');
      setStep(1);
      onClose();
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleConfirm = async () => {
    if (password && confirmText === 'SUPPRIMER') {
      await onConfirm(password);
      handleClose();
    }
  };

  const isStep1Valid = confirmText === 'SUPPRIMER';
  const isStep2Valid = password.length >= 6;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Supprimer définitivement le compte
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible et supprimera toutes vos données.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Attention !</h4>
                <p className="text-red-700 text-sm mb-2">
                  La suppression de votre compte entraînera la perte définitive de :
                </p>
                <ul className="text-red-700 text-sm space-y-1 ml-4">
                  <li>• Toutes vos sessions de surf</li>
                  <li>• Vos photos et images</li>
                  <li>• Vos commentaires et likes</li>
                  <li>• Votre historique de messages</li>
                  <li>• Votre profil et avatar</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-text">
                  Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  className="font-mono"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">🔐 Confirmation finale</h4>
                <p className="text-yellow-700 text-sm">
                  Entrez votre mot de passe pour confirmer la suppression du compte <strong>{username}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe actuel</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          
          {step === 1 && (
            <Button
              onClick={handleNextStep}
              disabled={!isStep1Valid}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            >
              Continuer
            </Button>
          )}

          {step === 2 && (
            <Button
              onClick={handleConfirm}
              disabled={!isStep2Valid || isLoading}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </div>
              ) : (
                <div className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </div>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}