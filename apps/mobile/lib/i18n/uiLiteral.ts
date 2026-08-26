import { useSettingsStore } from '../../src/stores/settingsStore';
import { en } from './en';
import { es } from './es';

const supplementalSpanish: Record<string, string> = {
  // Encrypted backup
  'Back up first': 'Haz una copia primero',
  'This removes profiles, votes, partner sync state, pending sync events, and age verification from this device. This cannot be undone unless you have an encrypted backup.':
    'Esto elimina de este dispositivo los perfiles, votos, el estado de sincronización con tu pareja, los eventos pendientes y la verificación de edad. No se puede deshacer a menos que tengas una copia de seguridad cifrada.',
  'and their data. An encrypted backup made before now can restore them.':
    'y sus datos. Una copia de seguridad cifrada creada antes de ahora puede restaurarlos.',
  'Encrypted Backups': 'Copias de seguridad cifradas',
  'You can create an encrypted backup of your profiles, votes, and progress. The backup is encrypted on your device with a recovery phrase that is shown to you once and is never sent anywhere or stored by SpiceSync. Only that phrase can open the backup, and if it is lost the backup cannot be recovered by us or anyone else. Backups are never uploaded automatically; the file goes wherever you choose to put it, and you are responsible for keeping it safe. Backups deliberately exclude your device sync identity, your partner link, your purchase entitlement, and any profile PINs.':
    'Puedes crear una copia de seguridad cifrada de tus perfiles, votos y progreso. La copia se cifra en tu dispositivo con una frase de recuperación que se muestra una sola vez y que nunca se envía a ningún lugar ni la guarda SpiceSync. Solo esa frase puede abrir la copia y, si se pierde, ni nosotros ni nadie podrá recuperarla. Las copias nunca se suben automáticamente; el archivo va donde tú decidas guardarlo y es tu responsabilidad mantenerlo seguro. Las copias excluyen deliberadamente la identidad de sincronización de tu dispositivo, tu vínculo de pareja, tu compra y cualquier PIN de perfil.',
  'Encrypted backup': 'Copia de seguridad cifrada',
  'Save or restore your data': 'Guarda o restaura tus datos',
  'Backups are encrypted on this device. Only your recovery phrase can open one, and nobody can recover it for you if it is lost.':
    'Las copias de seguridad se cifran en este dispositivo. Solo tu frase de recuperación puede abrirlas y nadie podrá recuperarla por ti si la pierdes.',
  'Create a backup': 'Crear una copia de seguridad',
  'Create backup': 'Crear copia de seguridad',
  'Encrypting...': 'Cifrando...',
  'This creates an encrypted copy of your profiles, votes, and progress. Your partner link and purchases are not included.':
    'Esto crea una copia cifrada de tus perfiles, votos y progreso. No incluye tu vínculo de pareja ni tus compras.',
  'Your recovery phrase': 'Tu frase de recuperación',
  'Write these words down now. They are shown once and are not stored anywhere.':
    'Anota estas palabras ahora. Se muestran una sola vez y no se guardan en ningún lugar.',
  'Copy recovery phrase': 'Copiar frase de recuperación',
  'Copy encrypted backup': 'Copiar copia de seguridad cifrada',
  'Your encrypted backup is on the clipboard. Paste it somewhere safe.':
    'Tu copia de seguridad cifrada está en el portapapeles. Pégala en un lugar seguro.',
  'Store your recovery phrase separately from the backup itself.':
    'Guarda tu frase de recuperación por separado de la copia de seguridad.',
  'Restore a backup': 'Restaurar una copia de seguridad',
  'Restore backup': 'Restaurar copia de seguridad',
  'Decrypting...': 'Descifrando...',
  'Recovery phrase': 'Frase de recuperación',
  'Enter your 12 words, separated by spaces':
    'Escribe tus 12 palabras, separadas por espacios',
  'Paste the encrypted backup here': 'Pega aquí la copia de seguridad cifrada',
  'Paste backup': 'Pegar copia de seguridad',
  Paste: 'Pegar',
  'Restore complete': 'Restauración completada',
  Restored: 'Restaurado',
  'Some items were skipped because backups may not restore them.':
    'Se omitieron algunos elementos porque las copias de seguridad no pueden restaurarlos.',
  'Restart the app to finish loading everything.':
    'Reinicia la app para terminar de cargar todo.',
  'Backup failed': 'Error en la copia de seguridad',
  'Something went wrong while creating the backup. Please try again.':
    'Algo salió mal al crear la copia de seguridad. Inténtalo de nuevo.',
  'Something went wrong while restoring. Please try again.':
    'Algo salió mal al restaurar. Inténtalo de nuevo.',
  'Enter your recovery phrase.': 'Escribe tu frase de recuperación.',
  'A recovery phrase has this many words:':
    'Una frase de recuperación tiene esta cantidad de palabras:',
  'These words are not part of a recovery phrase:':
    'Estas palabras no forman parte de una frase de recuperación:',
  'That phrase does not open this backup, or the backup has been altered.':
    'Esa frase no abre esta copia de seguridad, o la copia fue alterada.',
  'This backup opened but its contents are not readable.':
    'Esta copia de seguridad se abrió, pero su contenido no se puede leer.',
  'That does not look like a SpiceSync backup.':
    'Esto no parece una copia de seguridad de SpiceSync.',
  'Browse list screen': 'Pantalla de exploración',
  'Tier:': 'Nivel:',
  'Intensity:': 'Intensidad:',
  'Swipe for next': 'Desliza para avanzar',
  'Swipe to save': 'Desliza para guardar',
  'Date Night Settings': 'Ajustes de la noche de cita',
  'Enable Timer': 'Activar temporizador',
  'Minutes per topic': 'Minutos por tema',
  'Include Intimate Topics': 'Incluir temas íntimos',
  'Adds spicy conversation starters':
    'Añade preguntas de conversación picantes',
  'Background Theme': 'Tema de fondo',
  'Preparing your date night...': 'Preparando su noche de cita...',
  'Date Night': 'Noche de cita',
  'Swipe or tap arrows': 'Desliza o toca las flechas',
  'Conversation Starter': 'Pregunta para conversar',
  'Follow-up Questions': 'Preguntas de seguimiento',
  'Tips for Success': 'Consejos para que salga bien',
  'Choose a relaxed, private moment. Start with curiosity, not pressure. Listen more than you talk. Be open to your partner\'s response, whether it\'s enthusiastic, hesitant, or a "not right now."':
    'Elijan un momento tranquilo y privado. Empiecen con curiosidad, sin presión. Escuchen más de lo que hablan. Acepten la respuesta de su pareja, ya sea entusiasta, dudosa o un «ahora no».',
  'Conversation Topics': 'Temas de conversación',
  'Kink Not Found': 'Interés no encontrado',
  "We couldn't load topics for this kink.":
    'No pudimos cargar temas para este interés.',
  'Back to Matches': 'Volver a coincidencias',
  "Let's Talk About": 'Hablemos de',
  'ways to start this conversation': 'formas de iniciar esta conversación',
  'A Gentle Reminder': 'Un recordatorio amable',
  'These conversations work best when both partners feel safe to say yes, no, or "I need more time." There\'s no wrong answer — curiosity is the goal.':
    'Estas conversaciones funcionan mejor cuando ambos se sienten seguros para decir sí, no o «necesito más tiempo». No hay respuestas incorrectas: la meta es la curiosidad.',
  'Back to conversation topics': 'Volver a los temas de conversación',
  PRIMARY: 'PRINCIPAL',
  SECONDARY: 'SECUNDARIO',
  'Use Love Languages prompts': 'Usar preguntas sobre lenguajes del amor',
  'Use prompts': 'Usar preguntas',
  'Open guided questions for turning your results into a real conversation.':
    'Abre preguntas guiadas para convertir tus resultados en una conversación real.',
  'Complete the quiz or revisit your current result.':
    'Completa el cuestionario o revisa tu resultado actual.',
  'Card Completed!': '¡Carta completada!',
  'Great job completing the challenge': 'Buen trabajo al completar el reto',
  'Draw Another Card': 'Sacar otra carta',
  'Back to Game Hub': 'Volver al centro de juego',
  'Back to Home': 'Volver al inicio',
  'Back to game menu': 'Volver al menú del juego',
  'Premium Feature': 'Función Premium',
  'Create your own custom cards with SpiceSync Premium':
    'Crea tus propias cartas con SpiceSync Premium',
  '✨ Custom Deck': '✨ Mazo personalizado',
  'custom cards created': 'cartas personalizadas creadas',
  'Card Type': 'Tipo de carta',
  'Card Content': 'Contenido de la carta',
  'Write your custom card...': 'Escribe tu carta personalizada...',
  '+ Add to Deck': '+ Añadir al mazo',
  'Your Custom Cards': 'Tus cartas personalizadas',
  '🗑️ Delete': '🗑️ Eliminar',
  '🔥 Level': '🔥 Nivel',
  '🍺 DRINKING MODE': '🍺 MODO CON BEBIDAS',
  'Premium Card': 'Carta Premium',
  'Unlock to see this card': 'Desbloquea para ver esta carta',
  '🍺 Or take a drink!': '🍺 ¡O toma un trago!',
  'activities to explore': 'actividades por explorar',
  'Search activities...': 'Buscar actividades...',
  Activities: 'Actividades',
  'Start Swiping (': 'Empezar a votar (',
  'Activity Not Found': 'Actividad no encontrada',
  'Go Back': 'Volver',
  '← Back': '← Volver',
  'Your Vote:': 'Tu voto:',
  'Vote on this activity': 'Vota esta actividad',
  '✓ Yes': '✓ Sí',
  '? Maybe': '? Tal vez',
  '✕ No': '✕ No',
  'Your compatibility at a glance': 'Su compatibilidad de un vistazo',
  'Compatibility Score': 'Puntuación de compatibilidad',
  'Based on your mutual interests': 'Basada en sus intereses mutuos',
  'Total Votes': 'Votos totales',
  'Yes Rate': 'Porcentaje de sí',
  'Activities you liked': 'Actividades que te gustaron',
  'Vote Distribution': 'Distribución de votos',
  'Top Categories': 'Categorías principales',
  liked: 'gustaron',
  'Intensity Preferences': 'Preferencias de intensidad',
  Beginner: 'Principiante',
  Moderate: 'Moderado',
  Advanced: 'Avanzado',
  'Partner setup': 'Configuración de pareja',
  'Protect your connection': 'Protege tu conexión',
  'Add a sign-in method to keep your encrypted partner connection available on this device.':
    'Añade un método de inicio de sesión para mantener disponible en este dispositivo tu conexión de pareja cifrada.',
  'Add a sign-in method so this encrypted partner connection stays available on this device.':
    'Añade un método de inicio de sesión para que esta conexión de pareja cifrada siga disponible en este dispositivo.',
  'Continue with Google': 'Continuar con Google',
  'Continue with Apple': 'Continuar con Apple',
  'Continuing...': 'Continuando...',
  'Not now': 'Ahora no',
  'Your existing account': 'Tu cuenta existente',
  'Sign into existing account': 'Iniciar sesión en una cuenta existente',
  'This sign-in uses a new credential and switches to the account that already uses this provider.':
    'Este inicio de sesión usa una credencial nueva y cambia a la cuenta que ya usa este proveedor.',
  'Could not protect your connection.': 'No se pudo proteger tu conexión.',
  'Could not restore your account.': 'No se pudo restaurar tu cuenta.',
  'Restore existing account': 'Restaurar cuenta existente',
  'Welcome back': 'Te damos la bienvenida de nuevo',
  'Sign in with the account you used before to restore your partner connection.':
    'Inicia sesión con la cuenta que usaste antes para restaurar tu conexión de pareja.',
  'Confirm local profile': 'Confirma el perfil local',
  'Which profile is yours?': '¿Qué perfil es el tuyo?',
  'Choose the profile on this device before restoring encrypted partner sync.':
    'Elige el perfil de este dispositivo antes de restaurar la sincronización cifrada con tu pareja.',
  'Could not confirm this profile.': 'No se pudo confirmar este perfil.',
  'Use this profile': 'Usar este perfil',
  'How do you want to compare?': '¿Cómo quieren comparar?',
  'You appear as': 'Apareces como',
  'Two profiles on this device': 'Dos perfiles en este dispositivo',
  'Add local profile': 'Añadir perfil local',
  'Remote partner': 'Pareja remota',
  'Paste invite link': 'Pegar enlace de invitación',
  'Paste link': 'Pegar enlace',
  'Send a private invite': 'Enviar una invitación privada',
  'Shared with your partner': 'Compartido con tu pareja',
  'Invite link': 'Enlace de invitación',
  'Copy link': 'Copiar enlace',
  'Share link': 'Compartir enlace',
  'Scan the QR code with another device, copy the link, or use the share sheet. Leave this screen open so we can detect when your partner accepts.':
    'Escanea el código QR con otro dispositivo, copia el enlace o usa el menú para compartir. Deja esta pantalla abierta para detectar cuando tu pareja acepte.',
  'Could not check invite': 'No se pudo comprobar la invitación',
  'The link includes a temporary secret that proves you were invited.':
    'El enlace incluye un secreto temporal que demuestra que recibiste la invitación.',
  'Accept remote invite': 'Aceptar invitación remota',
  'Invite from': 'Invitación de',
  'Your votes stay encrypted end-to-end and matches are computed on your device.':
    'Tus votos permanecen cifrados de extremo a extremo y las coincidencias se calculan en tu dispositivo.',
  'Could not load invite': 'No se pudo cargar la invitación',
  'Checking invite...': 'Comprobando invitación...',
  'Invite expired': 'La invitación caducó',
  'Invite already used': 'La invitación ya fue utilizada',
  'Could not link': 'No se pudo vincular',
  'Use this device instead': 'Usar este dispositivo',
  'Back to partner setup': 'Volver a la configuración de pareja',
  'Made with 🌶️ for curious couples': 'Hecho con 🌶️ para parejas curiosas',
  ACHIEVEMENTS: 'LOGROS',
  'active days tracked locally': 'días activos registrados localmente',
  Locked: 'Bloqueado',
  'No Active Profile': 'No hay un perfil activo',
  'Please create a profile first to take the Love Languages quiz.':
    'Crea un perfil antes de hacer el cuestionario de lenguajes del amor.',
  'Your Love Language': 'Tu lenguaje del amor',
  'Your Primary Love Language': 'Tu lenguaje del amor principal',
  'Your Secondary Love Language': 'Tu lenguaje del amor secundario',
  'Your Scores': 'Tus puntuaciones',
  OR: 'O',
  'My Votes': 'Mis votos',
  'Filter and sort votes': 'Filtrar y ordenar votos',
  'FILTER & SORT': 'FILTRAR Y ORDENAR',
  VOTE: 'VOTO',
  'Filter votes': 'Filtrar votos',
  SORT: 'ORDENAR',
  'Sort votes': 'Ordenar votos',
  Default: 'Predeterminado',
  'A to Z': 'De A a Z',
  'Intensity low to high': 'Intensidad de menor a mayor',
  'Intensity high to low': 'Intensidad de mayor a menor',
  vote: 'voto',
  votes: 'votos',
  'Tap any card to review or change your vote':
    'Toca cualquier carta para revisar o cambiar tu voto',
  'No votes yet': 'Aún no hay votos',
  'No votes match this filter.': 'Ningún voto coincide con este filtro.',
  'Change your answer': 'Cambia tu respuesta',
  YES: 'SÍ',
  MAYBE: 'TAL VEZ',
  NO: 'NO',
  'Daily Reminder': 'Recordatorio diario',
  'Conversation Starters': 'Preguntas para conversar',
  'Streak Reminders': 'Recordatorios de racha',
  'Reminder Frequency': 'Frecuencia del recordatorio',
  'How often your daily reminder arrives.':
    'Con qué frecuencia llega tu recordatorio diario.',
  'Notification preferences stay on this device.':
    'Las preferencias de notificaciones permanecen en este dispositivo.',
  'Connection status': 'Estado de la conexión',
  'Remote sync active': 'Sincronización remota activa',
  'Disconnect remote partner': 'Desconectar pareja remota',
  'No remote partner connected': 'No hay una pareja remota conectada',
  'Create or accept a private invite link to sync encrypted vote updates with a partner on another device.':
    'Crea o acepta un enlace de invitación privado para sincronizar votos cifrados con una pareja en otro dispositivo.',
  'Open partner setup': 'Abrir configuración de pareja',
  'Local data controls': 'Controles de datos locales',
  'Adults only. Consent first.': 'Solo adultos. El consentimiento primero.',
  'SpiceSync is for adults exploring privately with mutual respect. Your local profiles and votes stay on this device unless you link a remote partner.':
    'SpiceSync es para adultos que exploran en privado con respeto mutuo. Tus perfiles y votos locales permanecen en este dispositivo a menos que vincules una pareja remota.',
  POLICIES: 'POLÍTICAS',
  Read: 'Leer',
  'DATA CONTROLS': 'CONTROLES DE DATOS',
  'Clear my votes': 'Borrar mis votos',
  'Local only': 'Solo local',
  'All local data': 'Todos los datos locales',
  'STARTING INTENSITY': 'INTENSIDAD INICIAL',
  'Pick your first deck': 'Elige tu primer mazo',
  'Choose the intensity that should appear when you start swiping.':
    'Elige la intensidad que debe aparecer cuando empieces a votar.',
  'Profile not found': 'Perfil no encontrado',
  'This profile may have already been deleted.':
    'Es posible que este perfil ya haya sido eliminado.',
  'Enter name': 'Introduce un nombre',
  Avatar: 'Avatar',
  'Choose avatar': 'Elegir avatar',
  'Save Profile': 'Guardar perfil',
  'Tap to switch': 'Toca para cambiar',
  Profile: 'Perfil',
  'Back to Profiles': 'Volver a perfiles',
  'Available profile': 'Perfil disponible',
  'PIN protected': 'Protegido con PIN',
  PROFILE: 'PERFIL',
  'Name / avatar': 'Nombre / avatar',
  'Delete Profile': 'Eliminar perfil',
  Remove: 'Eliminar',
  'PRIVATE PROFILE': 'PERFIL PRIVADO',
  'Create your profile': 'Crea tu perfil',
  'Choose how you appear locally before you start answering cards.':
    'Elige cómo aparecerás localmente antes de empezar a responder cartas.',
  'Visible only inside this app.': 'Visible solo dentro de esta app.',
  'Digits only. You need this PIN to switch profiles.':
    'Solo dígitos. Necesitas este PIN para cambiar de perfil.',
  'Keep this profile open, or add a PIN later.':
    'Mantén este perfil abierto o añade un PIN más tarde.',
  'Profile PIN': 'PIN del perfil',
  'Current PIN': 'PIN actual',
  'New PIN': 'PIN nuevo',
  'Confirm PIN': 'Confirmar PIN',
  'Save PIN': 'Guardar PIN',
  'Remove PIN': 'Eliminar PIN',
  'Pre-launch checks': 'Comprobaciones previas al lanzamiento',
  'CURRENT BUILD': 'COMPILACIÓN ACTUAL',
  'passing,': 'correctas,',
  'to review,': 'por revisar,',
  'blocking.': 'bloqueantes.',
  CHECKS: 'COMPROBACIONES',
  'These checks only show release posture and never display Supabase keys, receipts, or other secrets.':
    'Estas comprobaciones solo muestran el estado del lanzamiento y nunca enseñan claves de Supabase, recibos ni otros secretos.',
  'Last updated: August 2026': 'Última actualización: agosto de 2026',
  Overview: 'Resumen',
  'SpiceSync is designed with privacy as a core principle. All data you create — profiles, votes, preferences, and matches — is stored on your device by default. If you connect a remote partner, SpiceSync uses a relay service only to pass encrypted sync updates between your devices.':
    'SpiceSync está diseñado con la privacidad como principio fundamental. Todos los datos que creas —perfiles, votos, preferencias y coincidencias— se almacenan en tu dispositivo de forma predeterminada. Si conectas una pareja remota, SpiceSync usa un servicio de retransmisión únicamente para transferir actualizaciones cifradas entre ambos dispositivos.',
  'Information We Collect': 'Información que recopilamos',
  'SpiceSync does not require an email address or password. If you choose Apple or Google to protect an account, SpiceSync uses the provider identifier needed to link and recover that account; we do not receive your provider password. When you use remote partner sync, SpiceSync creates an anonymous Supabase user ID and sends device IDs, device public keys for encryption and signing, invite and connection status, optional profile display metadata, and encrypted sync payloads to the relay.':
    'SpiceSync no requiere una dirección de correo ni una contraseña. Si eliges Apple o Google para proteger una cuenta, SpiceSync usa el identificador del proveedor necesario para vincular y recuperar esa cuenta; no recibimos la contraseña de tu proveedor. Cuando usas la sincronización remota, SpiceSync crea un identificador anónimo de Supabase y envía al servicio de retransmisión identificadores de dispositivo, claves públicas del dispositivo para cifrado y firma, el estado de invitación y conexión, metadatos opcionales del perfil y cargas de sincronización cifradas.',
  'How Your Data Is Stored': 'Cómo se almacenan tus datos',
  "All app data is stored locally using your device's built-in storage (AsyncStorage / SecureStore). With remote partner sync enabled, vote updates leave your device only after they are encrypted for your linked partner's device.":
    'Todos los datos de la app se almacenan localmente mediante el almacenamiento integrado del dispositivo (AsyncStorage / SecureStore). Con la sincronización remota activada, las actualizaciones de votos salen del dispositivo solo después de cifrarse para el dispositivo de tu pareja vinculada.',
  'Invite links contain a temporary secret used to link two devices. The relay stores invite status, linked device IDs, optional profile display metadata, and encrypted sync payloads. It does not receive the plaintext contents of your votes.':
    'Los enlaces de invitación contienen un secreto temporal para vincular dos dispositivos. El servicio de retransmisión almacena el estado de la invitación, los identificadores vinculados, metadatos opcionales del perfil y cargas de sincronización cifradas. No recibe el contenido sin cifrar de tus votos.',
  'Third-Party Services': 'Servicios de terceros',
  'Remote partner sync is provided through Supabase. SpiceSync does not include third-party advertising or tracking SDKs and does not use relay data for advertising.':
    'La sincronización remota se presta mediante Supabase. SpiceSync no incluye publicidad ni SDK de seguimiento de terceros y no usa los datos de retransmisión con fines publicitarios.',
  Children: 'Menores',
  'SpiceSync is intended exclusively for adults aged 18 and older. We do not knowingly collect any information from minors. An age confirmation is required before accessing any app content.':
    'SpiceSync está destinado exclusivamente a adultos de 18 años o más. No recopilamos deliberadamente información de menores. Se requiere confirmar la edad antes de acceder al contenido de la app.',
  'Data Deletion': 'Eliminación de datos',
  'Remote sync paused — sign in or recover to resume':
    'Sincronización remota en pausa — inicia sesión o recupera la cuenta para continuar',
  'The previous remote connection was cleared safely. Pending updates were not sent to another account or partner. Restore the intended account or start partner setup.':
    'La conexión remota anterior se borró de forma segura. Las actualizaciones pendientes no se enviaron a otra cuenta ni pareja. Recupera la cuenta prevista o inicia la configuración de pareja.',
  'Account switched. Restore that account before continuing partner setup.':
    'La cuenta cambió. Recupera esa cuenta antes de continuar con la configuración de pareja.',
  'Account deletion removes your SpiceSync authentication account, the provider email or identifier stored with it, account-associated device and couple metadata, invitations, and encrypted relay events. In-app deletion is immediate after fresh provider verification; manually verified requests are completed within 30 days. A manual request record retains the submitted provider, contact, status, and timestamps to process and document the request. Only the current device is cleared after in-app deletion; local copies on other devices remain until you reset or uninstall SpiceSync there. Reinstalling does not restore local profiles, votes, or history after deletion, unless you restore an encrypted backup you made yourself beforehand. Account deletion and store subscription cancellation are separate; SpiceSync currently offers lifetime access, not a subscription. Unlinking a partner revokes the connection, but clearing or uninstalling the app does not automatically delete relay records.':
    'La eliminación de la cuenta borra tu cuenta de autenticación de SpiceSync, el correo o identificador del proveedor almacenado con ella, los metadatos asociados de dispositivos y pareja, las invitaciones y los eventos cifrados. La eliminación en la app es inmediata tras verificar de nuevo el proveedor; las solicitudes verificadas manualmente se completan en un plazo de 30 días. El registro de la solicitud manual conserva el proveedor, contacto, estado y marcas de tiempo enviados para procesar y documentar la solicitud. Solo se borra el dispositivo actual después de la eliminación en la app; las copias locales de otros dispositivos permanecen hasta que restablezcas o desinstales SpiceSync allí. Reinstalar no restaura perfiles, votos ni historial local después de eliminar la cuenta, a menos que restaures una copia de seguridad cifrada que hayas creado tú antes. La eliminación de la cuenta y la cancelación de una suscripción de la tienda son procesos separados; SpiceSync ofrece actualmente acceso de por vida, no una suscripción. Desvincular una pareja revoca la conexión, pero borrar o desinstalar la app no elimina automáticamente los registros del servicio de retransmisión.',
  'Reinstall Recovery': 'Recuperación tras reinstalar',
  'Reinstall recovery for a still-existing account restores account and couple metadata, including device public keys, but does not restore local history, intimate profile data, or vote data.':
    'La recuperación tras reinstalar una cuenta que sigue existiendo restaura los metadatos de la cuenta y de la pareja, incluidas las claves públicas del dispositivo, pero no restaura el historial local, los datos íntimos del perfil ni los votos.',
  'Changes to This Policy': 'Cambios en esta política',
  'We may update this Privacy Policy from time to time. Any changes will be reflected in an updated version of the app.':
    'Podemos actualizar esta Política de privacidad periódicamente. Los cambios se reflejarán en una versión actualizada de la app.',
  Contact: 'Contacto',
  'If you have questions about this Privacy Policy, you can reach us through the App Store listing for SpiceSync.':
    'Si tienes preguntas sobre esta Política de privacidad, puedes contactarnos mediante la ficha de SpiceSync en App Store.',
  'Acceptance of Terms': 'Aceptación de los términos',
  'By downloading or using SpiceSync, you agree to these Terms of Service. If you do not agree, do not use the app.':
    'Al descargar o usar SpiceSync, aceptas estos Términos de servicio. Si no estás de acuerdo, no uses la app.',
  'Age Requirement': 'Requisito de edad',
  'SpiceSync is intended exclusively for adults aged 18 and older. By using the app, you confirm that you are at least 18 years of age. If you are under 18, you may not use this app.':
    'SpiceSync está destinado exclusivamente a adultos de 18 años o más. Al usar la app, confirmas que tienes al menos 18 años. Si eres menor de 18, no puedes usarla.',
  'Use of the App': 'Uso de la app',
  'SpiceSync is a personal tool for consenting adults to explore and share preferences with a partner. You agree to use the app only for its intended purpose and in compliance with all applicable laws in your jurisdiction.':
    'SpiceSync es una herramienta personal para que adultos que consienten exploren y compartan preferencias con una pareja. Aceptas usar la app solo para su propósito previsto y de conformidad con las leyes aplicables en tu jurisdicción.',
  Content: 'Contenido',
  'SpiceSync contains adult-oriented content. All content within the app is provided for informational and entertainment purposes between consenting adults. You are responsible for ensuring that your use of the app complies with local laws and regulations.':
    'SpiceSync contiene material dirigido a adultos. Todo el contenido se ofrece con fines informativos y de entretenimiento entre adultos que consienten. Eres responsable de que tu uso cumpla las leyes y normas locales.',
  'No Email Account Required': 'No se requiere cuenta de correo',
  'SpiceSync does not require an email address or password. Most app data is stored locally. If you enable remote partner sync, the app creates an anonymous backend identity and sends limited connection metadata and encrypted partner-sync data through the relay as described in the Privacy Policy.':
    'SpiceSync no requiere una dirección de correo ni una contraseña. La mayoría de los datos se almacena localmente. Si activas la sincronización remota, la app crea una identidad anónima y envía metadatos limitados de conexión y datos cifrados mediante el servicio de retransmisión, como se explica en la Política de privacidad.',
  'Disclaimer of Warranties': 'Exclusión de garantías',
  'SpiceSync is provided "as is" without warranties of any kind, express or implied. We do not warrant that the app will be error-free, uninterrupted, or meet your specific requirements.':
    'SpiceSync se proporciona «tal cual», sin garantías de ningún tipo, expresas o implícitas. No garantizamos que la app esté libre de errores, funcione sin interrupciones o satisfaga tus requisitos específicos.',
  'Limitation of Liability': 'Limitación de responsabilidad',
  'To the maximum extent permitted by law, SpiceSync and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.':
    'En la máxima medida permitida por la ley, SpiceSync y sus desarrolladores no serán responsables de daños indirectos, incidentales, especiales o consecuentes derivados del uso de la app.',
  'Changes to These Terms': 'Cambios en estos términos',
  'We may update these Terms of Service from time to time. Continued use of the app after changes are posted constitutes acceptance of the updated terms.':
    'Podemos actualizar estos Términos de servicio periódicamente. Seguir usando la app después de publicar cambios implica aceptar los términos actualizados.',
  'Questions about these terms can be directed to us through the App Store listing for SpiceSync.':
    'Puedes enviarnos preguntas sobre estos términos mediante la ficha de SpiceSync en App Store.',
  '💡 Suggestions': '💡 Sugerencias',
  'Personalized recommendations for you both':
    'Recomendaciones personalizadas para ambos',
  'Start Swiping!': '¡Empieza a votar!',
  'Vote on activities to get personalized suggestions':
    'Vota actividades para recibir sugerencias personalizadas',
  'Go to Deck': 'Ir a las cartas',
  'Quick Actions': 'Acciones rápidas',
  'Swipe More': 'Votar más',
  'See Matches': 'Ver coincidencias',
  'Play Game': 'Jugar',
  'Active now': 'Activo ahora',
  'day streak': 'días de racha',
  'Remote sync active · matches stay private':
    'Sincronización remota activa · las coincidencias siguen privadas',
  'Open partner sync': 'Abrir sincronización de pareja',
  'Partner sync': 'Sincronización de pareja',
  'ONE-TIME PURCHASE': 'COMPRA ÚNICA',
  'Unlock SpiceSync Premium': 'Desbloquea SpiceSync Premium',
  'More ways to play and explore together. Core matching, privacy, and partner features always stay free.':
    'Más formas de jugar y explorar juntos. Las funciones esenciales de coincidencias, privacidad y pareja siempre serán gratuitas.',
  'Lifetime access · no subscription': 'Acceso de por vida · sin suscripción',
  'Premium is unlocked': 'Premium está desbloqueado',
  'Restore Purchases': 'Restaurar compras',
  'Payment is charged to your App Store or Google Play account. This is a non-consumable purchase and can be restored on devices using the same store account.':
    'El pago se carga a tu cuenta de App Store o Google Play. Es una compra no consumible que puede restaurarse en dispositivos con la misma cuenta de la tienda.',
  'SpiceSync couple match': 'Coincidencia de pareja en SpiceSync',
  'Private by default': 'Privado por defecto',
  'Choose Avatar': 'Elegir avatar',
  'Couple match': 'Coincidencia de pareja',
  'Active couple': 'Pareja activa',
  "It's a Match!": '¡Hay coincidencia!',
  'You both want to try this': 'Ambos quieren probar esto',
  'Add to Favorites': 'Añadir a favoritos',
  Discuss: 'Hablar',
  'Continue Exploring': 'Seguir explorando',
  '💬 Talk About This': '💬 Hablar sobre esto',
  'Verify PIN': 'Verificar PIN',
  'Enter the PIN for': 'Introduce el PIN de',
  'No profile to verify.': 'No hay ningún perfil que verificar.',
  No: 'No',
  'Compact match summary': 'Resumen compacto de coincidencias',
  'Close match details': 'Cerrar detalles de la coincidencia',
  'Filter matches': 'Filtrar coincidencias',
  'FILTER MATCHES': 'FILTRAR COINCIDENCIAS',
  Result: 'Resultado',
  'Category filters': 'Filtros de categoría',
  Level: 'Nivel',
  Role: 'Rol',
  'Hide follow-ups': 'Ocultar preguntas de seguimiento',
  'Show follow-ups': 'Mostrar preguntas de seguimiento',
  '🍺 Take Drink': '🍺 Tomar un trago',
  '🔄 Skip': '🔄 Saltar',
  '🔓 Unlock': '🔓 Desbloquear',
  '🍺 Did It / Drink': '🍺 Hecho / Tomar un trago',
  '✅ Accept': '✅ Aceptar',
  yes: 'sí',
  maybe: 'tal vez',
  'Creating...': 'Creando...',
  'Create invite link': 'Crear enlace de invitación',
  'Linking...': 'Vinculando...',
  'Accept invite': 'Aceptar invitación',
  'Finish restoring your account': 'Termina de restaurar tu cuenta',
  'This account has a connection waiting to be restored. Finish restoring it before creating or accepting a new partner connection.':
    'Esta cuenta tiene una conexión pendiente de restaurar. Termina de restaurarla antes de crear o aceptar una nueva conexión de pareja.',
  'Restore account': 'Restaurar cuenta',
  Premium: 'Premium',
  v: 'v',
  'Start swiping to vote on activities.':
    'Empieza a votar para calificar actividades.',
  'No votes yet for filter:': 'Aún no hay votos con el filtro:',
  'Tap to change.': 'Toca para cambiar.',
  'Resetting...': 'Restableciendo...',
  'Reset app on this device': 'Restablecer la app en este dispositivo',
  'Start Swiping': 'Empezar a votar',
  'Save Preference': 'Guardar preferencia',
  'Unlock Unlimited Profiles': 'Desbloquear perfiles ilimitados',
  Selected: 'Seleccionado',
  Select: 'Seleccionar',
  'Set a 4-digit PIN': 'Configurar un PIN de 4 dígitos',
  PIN: 'PIN',
  Optional: 'Opcional',
  'Create Profile & Set PIN': 'Crear perfil y configurar PIN',
  'Enter the current PIN, then choose a new 4-digit PIN.':
    'Introduce el PIN actual y elige uno nuevo de 4 dígitos.',
  'Choose a 4-digit PIN for switching to this profile.':
    'Elige un PIN de 4 dígitos para cambiar a este perfil.',
  'Switch to': 'Cambiar a',
  and: 'y',
  'Unlock for': 'Desbloquear por',
  'Store product unavailable': 'Producto de la tienda no disponible',
  avatar: 'avatar',
  'matches ready now': 'coincidencias listas ahora',
  Play: 'Jugar',
  'items stay private': 'elementos permanecen privados',
  Open: 'Abrir',
  'match details': 'detalles de la coincidencia',
  L: 'N',
  matches: 'coincidencias',
  'Hide filters': 'Ocultar filtros',
  'Show filters': 'Mostrar filtros',
  Manage: 'Gestionar',
  voted: 'votó',
  no: 'no',
  'Empty Card': 'Carta vacía',
  'Please enter some content for your card':
    'Escribe algún contenido para tu carta',
  'Card Added!': '¡Carta añadida!',
  'Your custom card has been added to your deck':
    'Tu carta personalizada se añadió al mazo',
  'Purchase unavailable': 'Compra no disponible',
  'Premium restored': 'Premium restaurado',
  'Nothing to restore': 'No hay nada que restaurar',
  'Your lifetime Premium access is active on this device.':
    'Tu acceso Premium de por vida está activo en este dispositivo.',
  'No lifetime Premium purchase was found for this store account.':
    'No se encontró una compra Premium de por vida para esta cuenta de la tienda.',
  'Could not create invite': 'No se pudo crear la invitación',
  'Check your connection and try again.':
    'Comprueba tu conexión e inténtalo de nuevo.',
  Copied: 'Copiado',
  'Invite link copied to the clipboard.':
    'Enlace de invitación copiado al portapapeles.',
  'Paste the full invite link your partner created.':
    'Pega el enlace de invitación completo que creó tu pareja.',
  Connected: 'Conectado',
  'You are now linked with your partner.':
    'Ahora estás vinculado con tu pareja.',
  'Start Exploring': 'Empezar a explorar',
  'Please try again.': 'Inténtalo de nuevo.',
  'Could not update profile': 'No se pudo actualizar el perfil',
  'Delete profile?': '¿Eliminar perfil?',
  'This permanently removes': 'Esto elimina permanentemente a',
  'and their data.': 'y sus datos.',
  'Could not create profile': 'No se pudo crear el perfil',
  'Clear your votes?': '¿Borrar tus votos?',
  'This removes selections for the active profile on this device. Partner data and profiles stay in place.':
    'Esto elimina las selecciones del perfil activo en este dispositivo. Los datos de la pareja y los perfiles se conservan.',
  'Clear votes': 'Borrar votos',
  'Votes cleared': 'Votos borrados',
  'No active profile': 'No hay un perfil activo',
  'Your active profile selections were removed.':
    'Se eliminaron las selecciones de tu perfil activo.',
  'Choose or create a profile before clearing votes.':
    'Elige o crea un perfil antes de borrar votos.',
  'Disconnect remote partner?': '¿Desconectar la pareja remota?',
  'This clears the remote partner link, partner votes, reveal consent, and pending sync events from this device.':
    'Esto borra de este dispositivo el vínculo remoto, los votos de la pareja, el consentimiento para revelar y los eventos de sincronización pendientes.',
  Disconnect: 'Desconectar',
  'Partner disconnected': 'Pareja desconectada',
  'Remote sync data was cleared.':
    'Se borraron los datos de sincronización remota.',
  'Reset app on this device?': '¿Restablecer la app en este dispositivo?',
  'This removes profiles, votes, partner sync state, pending sync events, and age verification from this device. This cannot be undone.':
    'Esto elimina del dispositivo perfiles, votos, el estado de sincronización, eventos pendientes y la verificación de edad. No se puede deshacer.',
  'Reset device': 'Restablecer dispositivo',
  'Could not reset this device.': 'No se pudo restablecer este dispositivo.',
  'Reset failed': 'Falló el restablecimiento',
  "This clears the partner link, partner votes, reveal consent, and pending sync events from this device. It does not delete anything from your partner's device.":
    'Esto borra de este dispositivo el vínculo, los votos de la pareja, el consentimiento para revelar y los eventos pendientes. No elimina nada del dispositivo de tu pareja.',
  'All filters': 'Todos los filtros',
  'active filter': 'filtro activo',
  'active filters': 'filtros activos',
  All: 'Todos',
  Unseen: 'Sin ver',
  'All roles': 'Todos los roles',
  Paired: 'En pareja',
  'You give': 'Tú das',
  'You receive': 'Tú recibes',
  Both: 'Ambos',
  'All levels': 'Todos los niveles',
  'Level 1': 'Nivel 1',
  'Level 2': 'Nivel 2',
  'Level 3': 'Nivel 3',
  ALL: 'TODOS',
  CURIOUS: 'CURIOSO',
  'NOT NOW': 'AHORA NO',
  'HARD NO': 'NO',
  'Ready for this': 'Listo para esto',
  'Open to exploring': 'Abierto a explorar',
  'Maybe later — shared as a talk topic':
    'Quizá después — se comparte como tema de conversación',
  'Always stays private': 'Siempre permanece privado',
  Pass: 'Correcto',
  Review: 'Revisar',
  Fix: 'Corregir',
  'App identity': 'Identidad de la app',
  'Production IDs': 'Identificadores de producción',
  'Placeholder IDs': 'Identificadores provisionales',
  'Bundle and package identifiers are release shaped.':
    'Los identificadores del paquete tienen formato de producción.',
  'Replace anonymous bundle/package identifiers before store submission.':
    'Sustituye los identificadores anónimos antes de enviar a la tienda.',
  'App version': 'Versión de la app',
  Missing: 'Falta',
  'A visible semantic app version is configured.':
    'Hay configurada una versión semántica visible.',
  'Add an app version before release review.':
    'Añade una versión antes de revisar el lanzamiento.',
  'EAS project': 'Proyecto EAS',
  Configured: 'Configurado',
  Local: 'Local',
  'Builds can target an EAS project.':
    'Las compilaciones pueden usar un proyecto EAS.',
  'Set a real EAS project id before relying on hosted builds.':
    'Configura un identificador EAS real antes de usar compilaciones alojadas.',
  'Supabase relay': 'Servicio de retransmisión de Supabase',
  'Not configured': 'No configurado',
  'Remote partner sync can reach the relay.':
    'La sincronización remota puede acceder al servicio de retransmisión.',
  'Remote partner sync needs Supabase URL and anon key in release builds.':
    'La sincronización remota necesita la URL y la clave anónima de Supabase en producción.',
  Purchases: 'Compras',
  'Provider enabled': 'Proveedor activado',
  'Free beta access': 'Acceso beta gratuito',
  'Free mode': 'Modo gratuito',
  'The purchase provider flag is enabled for this build.':
    'El proveedor de compras está activado en esta compilación.',
  'Purchases are disabled and premium features are unlocked for beta testing.':
    'Las compras están desactivadas y las funciones Premium están abiertas para la beta.',
  'Purchases are disabled, so premium unlocks remain unavailable.':
    'Las compras están desactivadas, por lo que Premium no puede desbloquearse.',
  'Launch prompt': 'Aviso al iniciar',
  'Opt-in only': 'Solo con activación',
  'Notification permission is requested on app launch.':
    'El permiso de notificaciones se solicita al iniciar la app.',
  'Notification permission is requested only when a user enables reminders.':
    'El permiso se solicita solo cuando el usuario activa recordatorios.',
  'Legal screens': 'Pantallas legales',
  Mounted: 'Montadas',
  'Privacy Policy and Terms are available from Settings.':
    'La Política de privacidad y los Términos están disponibles en Configuración.',
  'Mount legal screens before submitting to stores.':
    'Añade las pantallas legales antes de enviar a las tiendas.',
  'Revisit This Maybe': 'Revisar este «tal vez»',
  'You said “maybe” to': 'Dijiste «tal vez» a',
  'want to discuss it?': '¿quieren hablar de ello?',
  'More activities from': 'Más actividades de',
  More: 'Más',
  'Since you like': 'Como te gusta',
  try: 'prueba',
  'Ready for More?': '¿Listos para más?',
  'Try something more adventurous:': 'Prueben algo más atrevido:',
  'Matches!': '¡Coincidencias!',
  "You've found 10 things you both want to try. Time to pick one!":
    'Han encontrado 10 cosas que ambos quieren probar. ¡Es hora de elegir una!',
  "Today's Pick": 'La elección de hoy',
  'Try something new:': 'Prueben algo nuevo:',
  explore: 'explorar',
  trending: 'tendencia',
  milestone: 'logro',
  match: 'coincidencia',
  'Use two profiles on this device, or link a partner on another device with encrypted sync.':
    'Usa dos perfiles en este dispositivo o vincula una pareja en otro dispositivo mediante sincronización cifrada.',
  'Add a second local profile when you share one phone or tablet. No network sync is needed.':
    'Añade un segundo perfil local si comparten un teléfono o tableta. No hace falta sincronización de red.',
  'Create an encrypted invite link for a partner using their own device. Your selected avatar is shared with them.':
    'Crea un enlace de invitación cifrado para una pareja que usa su propio dispositivo. Se compartirá el avatar que elegiste.',
  'Use a link from another device when Messages, AirDrop, or the share sheet is not available.':
    'Usa un enlace de otro dispositivo cuando Mensajes, AirDrop o el menú para compartir no estén disponibles.',
  'Your partner will see your selected avatar, then both devices sync encrypted vote updates.':
    'Tu pareja verá el avatar que elegiste y después ambos dispositivos sincronizarán votos cifrados.',
  'Creating invite...': 'Creando invitación...',
  "Paste the full private invite link from your partner's device.":
    'Pega el enlace de invitación privado completo del dispositivo de tu pareja.',
  'This links two devices. The relay only stores encrypted updates.':
    'Esto vincula dos dispositivos. El servicio de retransmisión solo almacena actualizaciones cifradas.',
  'Ask your partner to create a new invite, or use this device instead.':
    'Pide a tu pareja que cree una invitación nueva o usa este dispositivo.',
  GENERAL: 'GENERAL',
  'One-time purchase': 'Compra única',
  'Locked matches': 'Coincidencias bloqueadas',
  'Join me on SpiceSync': 'Únete a mí en SpiceSync',
  Truth: 'Verdad',
  Dare: 'Reto',
  Challenge: 'Desafío',
  Fantasy: 'Fantasía',
  Roleplay: 'Juego de rol',
  Adventure: 'Aventura',
  Sensual: 'Sensual',
  Playful: 'Juguetón',
  Kink: 'Interés',
  Public: 'Público',
  Spontaneous: 'Espontáneo',
  Romantic: 'Romántico',
  Adventurous: 'Aventurero',
  Relaxed: 'Relajado',
  Intense: 'Intenso',
  'The full Spice Deck library, including every themed pack':
    'La biblioteca completa de Spice Deck, con todos los paquetes temáticos',
  'Match Missions, Know Me Better, and Couple Dice':
    'Misiones de coincidencia, Conóceme mejor y Dados de pareja',
  'Create your own game cards': 'Crea tus propias cartas de juego',
  'Advanced Insights': 'Estadísticas avanzadas',
  'Love Languages quiz': 'Cuestionario de lenguajes del amor',
  'Unlimited local profiles': 'Perfiles locales ilimitados',
  'Future premium content updates':
    'Futuras actualizaciones de contenido Premium',
  Weekly: 'Semanalmente',
  'Every other day': 'Cada dos días',
  Daily: 'Diariamente',
  On: 'Activadas',
  Off: 'Desactivadas',
  'Check again': 'Comprobar de nuevo',
  'Try again': 'Intentar de nuevo',
  'Back to setup': 'Volver a la configuración',
  'Your partner': 'Tu pareja',
  'Words of Affirmation': 'Palabras de afirmación',
  'Quality Time': 'Tiempo de calidad',
  'Receiving Gifts': 'Recibir regalos',
  'Acts of Service': 'Actos de servicio',
  'Physical Touch': 'Contacto físico',
  'You feel loved when your partner gives you compliments, says "I love you," or expresses appreciation verbally.':
    'Te sientes querido cuando tu pareja te hace cumplidos, dice «te quiero» o expresa su aprecio con palabras.',
  'You feel loved when your partner gives you their undivided attention and spends meaningful time with you.':
    'Te sientes querido cuando tu pareja te presta toda su atención y comparte tiempo significativo contigo.',
  'You feel loved when your partner gives you thoughtful presents, big or small, that show they were thinking of you.':
    'Te sientes querido cuando tu pareja te da regalos elegidos con cariño, grandes o pequeños, que demuestran que pensaba en ti.',
  'You feel loved when your partner does things to help you, like chores, errands, or tasks that make your life easier.':
    'Te sientes querido cuando tu pareja hace cosas para ayudarte, como tareas del hogar, recados o actividades que facilitan tu vida.',
  'You feel loved through physical connection—hugs, kisses, holding hands, and other forms of affectionate touch.':
    'Te sientes querido mediante la conexión física: abrazos, besos, tomarse de la mano y otras muestras de cariño.',
  'I like to receive notes of affection from my partner':
    'Me gusta recibir notas cariñosas de mi pareja',
  'I like to be hugged by my partner': 'Me gusta que mi pareja me abrace',
  'I feel loved when my partner gives me their full attention':
    'Me siento querido cuando mi pareja me presta toda su atención',
  'I feel loved when my partner does things to help me':
    'Me siento querido cuando mi pareja hace cosas para ayudarme',
  'I like to receive small gifts from my partner':
    'Me gusta recibir pequeños regalos de mi pareja',
  'I like to hear that I am appreciated by my partner':
    'Me gusta escuchar que mi pareja me valora',
  'I feel loved when my partner helps me with tasks':
    'Me siento querido cuando mi pareja me ayuda con tareas',
  'I feel loved when my partner holds my hand':
    'Me siento querido cuando mi pareja me toma de la mano',
  'I like to spend uninterrupted leisure time with my partner':
    'Me gusta pasar tiempo libre sin interrupciones con mi pareja',
  'I like when my partner gives me thoughtful surprises':
    'Me gusta que mi pareja me dé sorpresas especiales',
  'I feel loved when my partner compliments my appearance':
    'Me siento querido cuando mi pareja elogia mi apariencia',
  'I feel loved when my partner helps me with a project':
    'Me siento querido cuando mi pareja me ayuda con un proyecto',
  'I like to sit close to my partner': 'Me gusta sentarme cerca de mi pareja',
  'I like when my partner surprises me with a gift':
    'Me gusta que mi pareja me sorprenda con un regalo',
  'I feel loved when my partner runs errands for me':
    'Me siento querido cuando mi pareja hace recados por mí',
  'I feel loved when my partner tells me they love me':
    'Me siento querido cuando mi pareja me dice que me quiere',
  'I like to go places together with my partner':
    'Me gusta ir a lugares junto con mi pareja',
  'I like to hold hands with my partner':
    'Me gusta tomarme de la mano con mi pareja',
  'I feel loved when my partner gives me a thoughtful gift':
    'Me siento querido cuando mi pareja me da un regalo elegido con cariño',
  'I feel loved when my partner helps me around the house':
    'Me siento querido cuando mi pareja me ayuda en casa',
  'I like to hear encouraging words from my partner':
    'Me gusta escuchar palabras de ánimo de mi pareja',
  'I like when my partner cuddles with me':
    'Me gusta que mi pareja se acurruque conmigo',
  'I feel loved when my partner takes time to listen to me':
    'Me siento querido cuando mi pareja se toma tiempo para escucharme',
  'I feel loved when my partner brings me a small token of affection':
    'Me siento querido cuando mi pareja me trae un pequeño detalle cariñoso',
  'I like when my partner does chores without being asked':
    'Me gusta que mi pareja haga tareas sin que se lo pida',
  'I like when my partner tells me I look nice':
    'Me gusta que mi pareja me diga que me veo bien',
  'I feel loved when my partner gives me a massage':
    'Me siento querido cuando mi pareja me da un masaje',
  'I feel loved when my partner plans a special date for us':
    'Me siento querido cuando mi pareja planea una cita especial para nosotros',
  'I like receiving gifts on special occasions':
    'Me gusta recibir regalos en ocasiones especiales',
  'I like when my partner helps me solve a problem':
    'Me gusta que mi pareja me ayude a resolver un problema',
  'I feel loved when my partner gives me their undivided attention':
    'Me siento querido cuando mi pareja me presta toda su atención',
  'I feel loved when my partner says they are proud of me':
    'Me siento querido cuando mi pareja dice que está orgullosa de mí',
  'I like to be physically close to my partner':
    'Me gusta estar físicamente cerca de mi pareja',
  'I like when my partner remembers special occasions with a gift':
    'Me gusta que mi pareja recuerde las ocasiones especiales con un regalo',
  'I feel loved when my partner does things to lighten my load':
    'Me siento querido cuando mi pareja hace cosas para aliviar mi carga',
  'I feel loved when my partner plans activities for us to do together':
    'Me siento querido cuando mi pareja planea actividades para hacer juntos',
  'I like to hear "I love you" from my partner':
    'Me gusta que mi pareja me diga «te quiero»',
  'I like when my partner puts their arm around me':
    'Me gusta que mi pareja me rodee con el brazo',
  'I feel loved when my partner gives me a handmade gift':
    'Me siento querido cuando mi pareja me da un regalo hecho a mano',
  'I feel loved when my partner takes care of something I need done':
    'Me siento querido cuando mi pareja se ocupa de algo que necesito hacer',
  'I like when my partner listens to me without interrupting':
    'Me gusta que mi pareja me escuche sin interrumpir',
  'I like when my partner surprises me with something I mentioned wanting':
    'Me gusta que mi pareja me sorprenda con algo que mencioné que quería',
  'I feel loved when my partner gives me a kiss':
    'Me siento querido cuando mi pareja me da un beso',
  'I feel loved when my partner tells me what they admire about me':
    'Me siento querido cuando mi pareja me dice qué admira de mí',
  'I like when my partner helps me with my responsibilities':
    'Me gusta que mi pareja me ayude con mis responsabilidades',
  'I like when my partner creates special memories with me':
    'Me gusta que mi pareja cree recuerdos especiales conmigo',
  'I feel loved when my partner brings me flowers or a treat':
    'Me siento querido cuando mi pareja me trae flores o un detalle',
  'I feel loved when my partner embraces me':
    'Me siento querido cuando mi pareja me abraza',
  'I like to hear praise from my partner':
    'Me gusta escuchar elogios de mi pareja',
  'I like when my partner makes time for just us':
    'Me gusta que mi pareja reserve tiempo solo para nosotros',
  'I feel loved when my partner does a task I was dreading':
    'Me siento querido cuando mi pareja hace una tarea que yo temía hacer',
  'I feel loved when my partner gives me something they know I will enjoy':
    'Me siento querido cuando mi pareja me da algo que sabe que disfrutaré',
  'I like to walk while holding hands with my partner':
    'Me gusta caminar de la mano con mi pareja',
  'I like when my partner tells me I am valued':
    'Me gusta que mi pareja me diga que me valora',
  'I feel loved when my partner prioritizes time with me':
    'Me siento querido cuando mi pareja prioriza pasar tiempo conmigo',
  'I feel loved when my partner anticipates my needs and helps':
    'Me siento querido cuando mi pareja se anticipa a mis necesidades y me ayuda',
  'I like receiving meaningful gifts from my partner':
    'Me gusta recibir regalos significativos de mi pareja',
  'I like physical affection from my partner':
    'Me gustan las muestras físicas de cariño de mi pareja',
  'I feel loved when my partner expresses their appreciation for me':
    'Me siento querido cuando mi pareja expresa su aprecio por mí',
  'I feel loved when my partner is fully present with me':
    'Me siento querido cuando mi pareja está plenamente presente conmigo',
};

const spanishByEnglish = new Map<string, string>();

function collectCatalogPairs(english: unknown, spanish: unknown): void {
  if (typeof english === 'string' && typeof spanish === 'string') {
    spanishByEnglish.set(english, spanish);
    return;
  }

  if (Array.isArray(english) && Array.isArray(spanish)) {
    english.forEach((value, index) =>
      collectCatalogPairs(value, spanish[index])
    );
    return;
  }

  if (
    english &&
    spanish &&
    typeof english === 'object' &&
    typeof spanish === 'object'
  ) {
    for (const key of Object.keys(english as Record<string, unknown>)) {
      collectCatalogPairs(
        (english as Record<string, unknown>)[key],
        (spanish as Record<string, unknown>)[key]
      );
    }
  }
}

collectCatalogPairs(en, es);
Object.entries(supplementalSpanish).forEach(([english, spanish]) =>
  spanishByEnglish.set(english, spanish)
);

function splitWhitespace(value: string): {
  leading: string;
  text: string;
  trailing: string;
} {
  const normalized = value.replace(/\s+/g, ' ');
  return {
    leading: normalized.startsWith(' ') ? ' ' : '',
    text: normalized.trim(),
    trailing: normalized.endsWith(' ') ? ' ' : '',
  };
}

export function hasSpanishUiLiteral(value: string): boolean {
  const { text } = splitWhitespace(value);
  const translated = spanishByEnglish.get(text);
  return (
    Object.prototype.hasOwnProperty.call(supplementalSpanish, text) ||
    (!!translated && translated !== text)
  );
}

export function ui(value: string): string {
  const { leading, text, trailing } = splitWhitespace(value);
  if (useSettingsStore.getState().language !== 'es') {
    return `${leading}${text}${trailing}`;
  }
  return `${leading}${spanishByEnglish.get(text) ?? text}${trailing}`;
}
