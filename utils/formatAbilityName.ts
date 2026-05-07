export const formatAbilityName = (name?: string): string => {
    if (!name) return '';
    return name
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
};

