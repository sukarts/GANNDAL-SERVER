import cron from 'node-cron';
import { runAlertes } from '../modules/alertes/alertes.service.js';

// Planificateur d'alertes. Tourne chaque jour à 07:00.
// Isolé dans un try/catch: une erreur (ex: DB indisponible) ne doit pas tuer le process.
export function startScheduler(): void {
  cron.schedule('0 7 * * *', async () => {
    try {
      const resume = await runAlertes();
      console.log(`[scheduler] alertes générées: ${JSON.stringify(resume)}`);
    } catch (e) {
      console.error('[scheduler] échec run alertes', e);
    }
  });
  console.log('🕑 Scheduler alertes actif (quotidien 07:00)');
}
