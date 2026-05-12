export function createSettingSection(
    containerEl: HTMLElement,
    title: string,
    description?: string
) {
    const section = containerEl.createDiv();
    section.addClass("cosmos-settings-section");

    section.createEl("h3", {
        text: title
    }).addClass("cosmos-settings-section-title");

    if (description) {
        section.createEl("p", {
            text: description
        }).addClass("cosmos-settings-section-description");
    }

    return section;
}