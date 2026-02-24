export async function loadSectionData(unit, sectionId) {
  try {
    const path = `./data/${unit}/${sectionId}.json`;
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
