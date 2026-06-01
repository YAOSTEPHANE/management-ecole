/** Circuit : professeur principal → éducateur → directeur des études. */
export const ACADEMIC_VALIDATION_WORKFLOW_HINT =
  'professeur principal, éducateur, directeur des études';

export const gradeModificationSubmittedMessage =
  'Demande enregistrée. Validation requise : ' + ACADEMIC_VALIDATION_WORKFLOW_HINT + '.';

export const gradeDeletionSubmittedMessage =
  'Demande de suppression enregistrée. Validation en 3 étapes requise avant prise en compte.';

export const reportCardsSubmittedMessage = (count: number) =>
  count > 0
    ? `${count} demande(s) de bulletin soumise(s) au circuit de validation (${ACADEMIC_VALIDATION_WORKFLOW_HINT}).`
    : 'Aucune modification de moyenne à soumettre.';
