export const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

export const DELIVERY_PERIODS = ["Manhã", "Tarde", "Noite"] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type DeliveryPeriod = (typeof DELIVERY_PERIODS)[number];

export const WEEKDAY_FULL_NAMES: Record<(typeof WEEKDAYS)[number], string> = {
  Seg: "Segunda-feira",
  Ter: "Terça-feira",
  Qua: "Quarta-feira",
  Qui: "Quinta-feira",
  Sex: "Sexta-feira",
  Sáb: "Sábado",
  Dom: "Domingo",
};
