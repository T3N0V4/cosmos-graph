export type SettingSection = {
    rootEl: HTMLElement;
    headerEl: HTMLElement;
    contentEl: HTMLElement;
    setCollapsed: (collapsed: boolean) => void;
    toggle: () => void;
};

type CreateSettingSectionOptions = {
    description?: string;
    collapsed?: boolean;
};

export function createSettingSection(
    containerEl: HTMLElement,
    title: string,
    options: CreateSettingSectionOptions = {}
): SettingSection {
    let isCollapsed =
        options.collapsed ?? false;

    const sectionEl =
        containerEl.createDiv();

    sectionEl.addClass("cosmos-settings-section");

    const headerEl =
        sectionEl.createDiv();

    headerEl.addClass("cosmos-settings-section-header");

    const titleWrapperEl =
        headerEl.createDiv();

    titleWrapperEl.addClass("cosmos-settings-section-title-wrapper");

    const arrowEl =
        titleWrapperEl.createSpan();

    arrowEl.addClass("cosmos-settings-section-arrow");

    const titleEl =
        titleWrapperEl.createEl("h3", {
            text: title
        });

    titleEl.addClass("cosmos-settings-section-title");

    if (options.description) {
        const descriptionEl =
            sectionEl.createEl("p", {
                text: options.description
            });

        descriptionEl.addClass("cosmos-settings-section-description");
    }

    const contentEl =
        sectionEl.createDiv();

    contentEl.addClass("cosmos-settings-section-content");

    const applyCollapsedState = () => {
        if (isCollapsed) {
            sectionEl.addClass("is-collapsed");
            contentEl.hide();
            arrowEl.setText("▶");
        } else {
            sectionEl.removeClass("is-collapsed");
            contentEl.show();
            arrowEl.setText("▼");
        }
    };

    const setCollapsed = (collapsed: boolean) => {
        isCollapsed = collapsed;
        applyCollapsedState();
    };

    const toggle = () => {
        setCollapsed(!isCollapsed);
    };

    headerEl.addEventListener(
        "click",
        toggle
    );

    applyCollapsedState();

    return {
        rootEl: sectionEl,
        headerEl,
        contentEl,
        setCollapsed,
        toggle
    };
}