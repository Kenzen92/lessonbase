import React, { useState } from "react";
import FormModal from "../../layouts/FormModal";
import WizardLayout from "../../layouts/WizardLayout";
import AddAssignmentWizard from "./add_assignment_wizard.jsx";

const AddAssignmentModal = ({
  isOpen,
  setIsOpen,
  students,
  classGroups,
  subjects,
}) => {
  const [step, setStep] = useState(1);

  return (
    <FormModal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title="Create New Assignment"
    >
      <WizardLayout currentStep={step} totalSteps={3}>
        <AddAssignmentWizard
          step={step}
          setStep={setStep}
          setIsOpen={setIsOpen}
          students={students}
          classGroups={classGroups}
          subjects={subjects}
        />
      </WizardLayout>
    </FormModal>
  );
};
          
         

export default AddAssignmentModal;
