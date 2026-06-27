/**
 * Configuración del proyecto — se edita aquí y se versiona por git (NO es una opción dentro de la app).
 *
 * INITIAL_VIEW define QUÉ se muestra/posiciona al abrir la página (solo la posición inicial):
 *   'grupos'  -> como ahora: la página arranca arriba (sin desplazamiento automático).
 *   '16avos'  -> posiciona el cuadro completo (desde dieciseisavos).
 *   'octavos' -> posiciona el cuadro reducido desde octavos.
 *   'cuartos' -> posiciona el cuadro reducido desde cuartos.
 *   'semis'   -> posiciona el cuadro reducido desde semifinales.
 *   'final'   -> posiciona en la final / campeón.
 *
 * Cambiá el valor de abajo y volvé a compilar/publicar.
 */
export type InitialView = 'grupos' | '16avos' | 'octavos' | 'cuartos' | 'semis' | 'final';

export const INITIAL_VIEW: InitialView = '16avos';
