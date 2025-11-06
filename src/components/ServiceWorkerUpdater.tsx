"use client";

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

export function ServiceWorkerUpdater() {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const toastShownRef = useRef(false);

  useEffect(() => {
    const handleUpdateClick = () => {
      if (serviceWorkerRegistration && serviceWorkerRegistration.waiting) {
        serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          setServiceWorkerRegistration(registration);

          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNewVersionAvailable(true);
                  if (!toastShownRef.current) {
                    toast.info('新しいバージョンが利用可能です。更新するにはリロードしてください。', {
                      action: {
                        label: 'リロード',
                        onClick: () => handleUpdateClick(),
                      },
                      duration: Infinity,
                    });
                    toastShownRef.current = true;
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (newVersionAvailable) {
          window.location.reload();
        }
      });
    }
  }, [newVersionAvailable, serviceWorkerRegistration]);

  return null;
}