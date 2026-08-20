import fs from 'fs';
import path from 'path';

const mobileRoot = path.join(__dirname, '..');
const repoRoot = path.join(mobileRoot, '..', '..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('release privacy copy', () => {
  it('describes remote partner sync accurately in the in-app privacy policy', () => {
    const policy = read('apps/mobile/app/(settings)/privacy-policy.tsx');

    expect(policy).toContain('anonymous Supabase user ID');
    expect(policy).toContain('encrypted sync payloads');
    expect(policy).toContain('Apple');
    expect(policy).toContain('Google');
    expect(policy).toMatch(/account deletion/i);
    expect(policy).toContain('device public keys');
    expect(policy).toContain('does not restore local history');
    expect(policy).toContain('within 30 days');
    expect(policy).toContain('provider email or identifier');
    expect(policy).toContain('encrypted relay events');
    expect(policy).toContain('local copies on other devices remain');
    expect(policy).toContain('subscription cancellation are separate');
    expect(policy).toMatch(/does not\s+automatically delete relay records/);
    expect(policy).not.toContain('Because all data is stored locally');
  });

  it('keeps the expanded recovery and deletion disclosure translatable in Spanish', () => {
    const literals = read('apps/mobile/lib/i18n/uiLiteral.ts');

    expect(literals).toContain('Apple');
    expect(literals).toContain('Google');
    expect(literals).toContain('eliminación de la cuenta');
    expect(literals).toContain('claves públicas del dispositivo');
    expect(literals).toContain('historial local');
    expect(literals).toContain('en un plazo de 30 días');
    expect(literals).toContain('correo o identificador del proveedor');
    expect(literals).toContain('otros dispositivos permanecen');
    expect(literals).toContain('cancelación de una suscripción');
  });

  it('states the deletion boundary in both localized confirmations', () => {
    const english = read('apps/mobile/lib/i18n/en.ts');
    const spanish = read('apps/mobile/lib/i18n/es.ts');

    for (const copy of [english, spanish]) {
      expect(copy).toMatch(/30 días|30 days/);
      expect(copy).toMatch(/other devices|otros dispositivos/);
      expect(copy).toMatch(/reinstall|reinstalar/i);
      expect(copy).toMatch(/subscription|suscripción/);
    }
  });

  it('does not promise that all data always remains on-device', () => {
    const localizedCopy = [
      read('apps/mobile/lib/i18n/en.ts'),
      read('apps/mobile/lib/i18n/es.ts'),
    ].join('\n');

    expect(localizedCopy).not.toContain('Your data never leaves your device.');
    expect(localizedCopy).not.toContain(
      'Tus datos nunca salen de tu dispositivo.'
    );
    expect(localizedCopy).not.toContain(
      'No accounts, no tracking, no cloud storage.'
    );
    expect(localizedCopy).not.toContain(
      'Sin cuentas, sin rastreo, sin almacenamiento en la nube.'
    );
  });

  it('keeps the terms consistent with optional remote sync', () => {
    const terms = read('apps/mobile/app/(settings)/terms-of-service.tsx');

    expect(terms).toContain('anonymous backend identity');
    expect(terms).toContain('encrypted partner-sync data');
    expect(terms).not.toContain('All data is\n          stored locally');
  });

  it('keeps App Store metadata aligned with the relay and adult rating', () => {
    const metadata = read('docs/app-store-metadata.md');

    expect(metadata).toContain('**iOS age rating:** 18+');
    expect(metadata).toContain('anonymous Supabase authentication');
    expect(metadata).toContain('encrypted sync payloads');
    expect(metadata).not.toContain('Data Not Collected');
    expect(metadata).not.toContain('stored exclusively on-device');
  });
});
