// Class diagram commands are consolidated into generic member commands
// Re-export from the new location for backward compatibility
// Includes both class and enumeration shape configs
export {
  AddMemberCommand,
  DeleteMemberCommand,
  UpdateMemberCommand,
  CLASS_ATTRIBUTE_CONFIG,
  CLASS_METHOD_CONFIG,
  ENUMERATION_LITERAL_CONFIG,
} from '~/core/commands/canvas/members';
