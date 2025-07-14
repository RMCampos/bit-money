export type Message = {
  id: number;
  subject: string;
  content: string;
  daysToTrigger: number;
  recipients: string[];
  active: boolean;
  lastCheckIn?: string;
  nextReminder?: string;
};
