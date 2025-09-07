import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './strings.en.json';
import es from './strings.es.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: { en: { translation: en }, es: { translation: es } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const I18nProvider = ({ children }: any) => <>{children}</>;
export const useT = () => (k:string)=> i18n.t(k);