import {
  FaDna,
  FaAtom,
  FaGlobe,
  FaCalculator,
  FaDesktop,
  FaLandmark,
  FaPalette,
  FaMusic,
  FaBalanceScaleLeft,
  FaBook,
} from "react-icons/fa";

const subjectIconMap = {
  Mathematics: FaCalculator,
  Physics: FaBalanceScaleLeft,
  Chemistry: FaAtom,
  Biology: FaDna,
  History: FaLandmark,
  Literature: FaBook,
  "Computer Science": FaDesktop,
  Art: FaPalette,
  Music: FaMusic,
  Geography: FaGlobe,
  English: FaBook,
};

// Function to get the correct icon for a given subject name
export const getSubjectIcon = (subjectName) => {
  return subjectIconMap[subjectName] || FaBook; // Default to FaBook if subject not found
};

export default subjectIconMap;

