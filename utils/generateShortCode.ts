import { Buffer } from 'buffer';

export const generateShortCode = (saleorId: string): string => {
  // 1. Décoder le Base64 ou utiliser la chaîne brute
  // 2. Créer un hash numérique simple
  let hash = 0;
  for (let i = 0; i < saleorId.length; i++) {
    const char = saleorId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Conversion en entier 32 bits
  }
  
  // 3. Convertir en Base36 et extraire 5 caractères
  // On utilise Math.abs pour éviter le signe négatif
  return Math.abs(hash).toString(36).toUpperCase().substring(0, 5);
};

// Exemple avec votre ID :
// "T3JkZXI6YzVkNjllZjItNzFmNy00MDA5LTk1NTQtMjk0MWY5YzExNTE1" -> "7K9X2"