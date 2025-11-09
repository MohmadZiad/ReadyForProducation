export interface LocalizedString {
  en: string;
  ar: string;
}

export interface ProductConfig {
  id: string;
  label: LocalizedString;
  anchorDay: 1 | 15;
  defaultBasePrice: number;
  description?: LocalizedString;
}

export interface AddOnConfig {
  id: string;
  label: LocalizedString;
  price: number;
  explain: LocalizedString;
}
