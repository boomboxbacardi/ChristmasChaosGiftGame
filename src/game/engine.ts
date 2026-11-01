export const defaultPlayerNames = ["Rudolph", "Frost", "Blitzen", "Noel"];

export const uid = () => crypto.randomUUID?.() ?? Math.random().toString(16).slice(2);
