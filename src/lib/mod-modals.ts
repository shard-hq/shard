import {
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type GuildMember,
  type ModalSubmitInteraction,
  type User,
} from "discord.js";

const MODAL_TITLE_MAX = 45;
const REASON_MAX_LENGTH = 512;

export const extractReason = (
  interaction: ModalSubmitInteraction,
): string | null => {
  const trimmed = interaction.fields.getTextInputValue("reason").trim();
  return trimmed || null;
};

export interface ResolvedTarget {
  target: User;
  member: GuildMember | null;
}

export const fetchTargetAndMember = async (
  interaction: ModalSubmitInteraction<"cached">,
  userId: string,
): Promise<ResolvedTarget | null> => {
  const [target, member] = await Promise.all([
    interaction.client.users.fetch(userId).catch(() => null),
    interaction.guild.members.fetch(userId).catch(() => null),
  ]);
  return target ? { target, member } : null;
};

export const createReasonLabel = (placeholder: string): LabelBuilder =>
  new LabelBuilder()
    .setLabel("Reason")
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId("reason")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(REASON_MAX_LENGTH)
        .setPlaceholder(placeholder),
    );

export const createModerationModal = (
  prefix: string,
  action: string,
  target: User,
): ModalBuilder =>
  new ModalBuilder()
    .setCustomId(`${prefix}:${target.id}`)
    .setTitle(`${action} ${target.username}`.slice(0, MODAL_TITLE_MAX));
