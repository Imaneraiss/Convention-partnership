// ═══════════════════════════════════════════════════════════
// DICTIONNAIRE BILINGUE FR / AR
// Utilisé pour : dropdowns, traduction auto, export Word
// ═══════════════════════════════════════════════════════════

export const TRADUCTIONS = {
  // ─── Types de convention ───
  'Convention cadre de partenariat': 'اتفاقية إطار للشراكة',
  'Convention cadre': 'اتفاقية إطار',
  'Convention de partenariat': 'اتفاقية شراكة',
  'Convention spécifique': 'اتفاقية محددة',
  'Convention de coopération': 'اتفاقية تعاون',
  'Mémorandum': 'مذكرة تفاهم',
  'Avenant': 'ملحق',
  'Contrat': 'عقد',
  'Entente': 'اتفاق',

  // ─── Modes de renouvellement ───
  'Tacitement': 'ضمنياً',
  'Tacitement une fois pour la même période': 'ضمنياً مرة واحدة لنفس المدة',
  'Tacitement deux fois pour la même période': 'ضمنياً مرتين لنفس المدة',
  "Tacite dans la limite d'une durée totale de deux années consécutives": 'ضمنياً في حدود سنتين متتاليتين',
  "Une fois d'une année": 'مرة واحدة لمدة سنة',
  'Concertation des parties': 'تشاور الأطراف',
  'Par avenant': 'بموجب ملحق',
  "Par décision de l'Assemblée Générale extraordinaire": 'بقرار من الجمعية العامة الاستثنائية',
  'Non renouvelable': 'غير قابل للتجديد',

  // ─── Types de partenaire ───
  'PUBLIC': 'عام',
  'PRIVE': 'خاص',
  'SEMI_PUBLIC': 'شبه عام',
  'ASSOCIATION / ONG': 'جمعية / منظمة غير حكومية',
  'ONG': 'منظمة غير حكومية',
  'ASSOCIATION': 'جمعية',

  // ─── Types de comité ───
  'PILOTAGE': 'قيادة',
  'SUIVI': 'متابعة',
  'TECHNIQUE': 'تقني',
  'SCIENTIFIQUE': 'علمي',

  // ─── Fréquences de réunion ───
  'Hebdomadaire': 'أسبوعي',
  'Mensuelle': 'شهري',
  'Bimestrielle': 'كل شهرين',
  'Trimestrielle': 'ربع سنوي',
  'Semestrielle': 'نصف سنوي',
  'Annuelle': 'سنوي',

  // ─── Statuts budget ───
  'OUI': 'نعم',
  'NON': 'لا',
  'PARTIELLEMENT': 'جزئياً',

  // ─── Établissements UM5 ───
  'presidence': 'رئاسة الجامعة',
  'Présidence UM5': 'رئاسة جامعة محمد الخامس',
  'FLSH': 'كلية الآداب والعلوم الإنسانية',
  'FMD': 'كلية طب الأسنان',
  'FMPH': 'كلية الطب والصيدلة',
  'ENS': 'المدرسة العليا للأساتذة',
  'ENSAM': 'المدرسة الوطنية العليا للفنون والمهن',
  'ENSET': 'المدرسة العليا للتعليم التقني',
  'EST': 'المدرسة العليا للتكنولوجيا',
  'FSR': 'كلية العلوم',
  'FSJES AGDAL': 'كلية العلوم القانونية - أكدال',
  'FSJES SOUISSI': 'كلية العلوم القانونية - السويسي',
  'FSJES SALE': 'كلية العلوم القانونية - سلا',
  'EST SALE': 'المدرسة العليا للتكنولوجيا - سلا',
  'EMI': 'المدرسة المحمدية للمهندسين',
  'ENSIAS': 'المدرسة الوطنية العليا للمعلوميات وتحليل الأنظمة',
  'IS': 'المعهد العلمي',
};

// ═══════════════════════════════════════════════════════════
// HELPER 1 : Retourne un label bilingue "FR / AR"
// ═══════════════════════════════════════════════════════════
export const bil = (fr) => {
  if (!fr) return '';
  const ar = TRADUCTIONS[fr];
  return ar ? `${fr} / ${ar}` : fr;
};

// ═══════════════════════════════════════════════════════════
// HELPER 2 : Traduit une valeur AR → FR
// ═══════════════════════════════════════════════════════════
export const traduireArVersFr = (valeur) => {
  if (!valeur) return valeur;
  
  for (const [fr, ar] of Object.entries(TRADUCTIONS)) {
    if (ar === valeur) return fr;
    if (valeur.includes(ar) || ar.includes(valeur)) return fr;
  }
  
  return valeur;
};