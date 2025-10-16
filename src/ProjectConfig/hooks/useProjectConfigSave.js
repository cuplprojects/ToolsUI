import API from "../../hooks/api";

export const useProjectConfigSave = (
  projectId,
  enabledModules,
  toolModules,
  innerEnvelopes,
  outerEnvelopes,
  selectedBoxFields,
  selectedEnvelopeFields,
  extraTypeSelection,
  extraTypes,
  selectedCapacity,
  startBoxNumber,
  startOmrEnvelopeNumber,
  extraProcessingConfig,
  duplicateConfig,           // ✅ add duplicateConfig here
  fetchProjectConfigData,
  showToast,
  resetForm
) => {
  const handleSave = async () => {
    try {
      // 1️⃣ Save ProjectConfigs including Duplicate Tool
      const projectConfigPayload = {
        projectId: Number(projectId),
        modules: enabledModules.map(
          (m) => toolModules.find((tm) => tm.name === m)?.id
        ),
        envelope: JSON.stringify({
          Inner: innerEnvelopes.join(","),
          Outer: outerEnvelopes.join(","),
        }),
        BoxBreakingCriteria: selectedBoxFields,
        BoxNumber: startBoxNumber,
        OMRSerialNumber: startOmrEnvelopeNumber,
        EnvelopeMakingCriteria: selectedEnvelopeFields,
        BoxCapacity: selectedCapacity,
        DuplicateCriteria: duplicateConfig?.duplicateCriteria || [], // ✅
        Enhancement: duplicateConfig?.enhancementEnabled
          ? duplicateConfig?.enhancement || 0
          : 0, // ✅
      };

      await API.post(`/ProjectConfigs`, projectConfigPayload);

      // 2️⃣ Save ExtrasConfigurations
      const extrasPayloads = Object.entries(extraTypeSelection)
        .map(([typeName, mode]) => {
          const et = extraTypes.find((t) => t.type === typeName);
          if (!et) return null;

          const config = extraProcessingConfig[typeName] || {};

          const normalizedEnvelope = {
            Inner: String(config.envelopeType?.inner || ""),
            Outer: String(config.envelopeType?.outer || ""),
          };

          return {
            id: 0,
            projectId: Number(projectId),
            extraType: et.extraTypeId,
            mode,
            value:
              mode === "Fixed"
                ? String(config.fixedQty || 0)
                : mode === "Range"
                  ? String(config.range || 0)
                  : String(config.percentage || 0),
            envelopeType: JSON.stringify(normalizedEnvelope),
          };
        })
        .filter(Boolean);

      if (extrasPayloads.length > 0) {
        await Promise.all(
          extrasPayloads.map((payload) =>
            API.post(`/ExtrasConfigurations`, payload)
          )
        );
      }

      showToast("Configuration saved successfully!", "success");
      fetchProjectConfigData(projectId);
      resetForm();
      console.log("Saved:", { projectConfigPayload, extrasPayloads });
    } catch (err) {
      console.error("Failed to save configuration", err);
      showToast("Failed to save configuration", err);
      resetForm();
    }
  };

  return { handleSave };
};
