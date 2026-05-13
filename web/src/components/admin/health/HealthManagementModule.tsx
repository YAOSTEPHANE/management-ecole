import NurseHealthModule from '../../health/NurseHealthModule';
import { ADM } from '../adminModuleLayout';

export default function HealthManagementModule() {
  return (
    <div className={ADM.root}>
      <div>
        <h2 className={ADM.h2}>Infirmerie &amp; santé</h2>
        <p className={ADM.intro}>
          Dossiers médicaux, registre des visites, campagnes sanitaires et gestion des urgences.
        </p>
      </div>
      <NurseHealthModule />
    </div>
  );
}
