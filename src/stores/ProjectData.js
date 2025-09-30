// src/stores/ProjectData.js (or store.js)
import { create } from "zustand";

const useStore = create((set) => ({
  projectName: localStorage.getItem("selectedProjectName") || "",
  projectId: localStorage.getItem("selectedProjectId") || "",

  // Action to set project name and id
  setProject: (name, id) => {
    localStorage.setItem("selectedProjectName", name);
    localStorage.setItem("selectedProjectId", id);
    set({ projectName: name, projectId: id });
  },

  // Action to reset project data
  resetProject: () => {
    localStorage.removeItem("selectedProjectName");
    localStorage.removeItem("selectedProjectId");
    set({ projectName: "", projectId: "" });
  },
}));

export default useStore;
