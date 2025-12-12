// Class commands are now consolidated into generic member commands
// Re-export from the new location for backward compatibility
export {
  AddMemberCommand,
  DeleteMemberCommand,
  UpdateMemberCommand,
  CLASS_ATTRIBUTE_CONFIG,
  CLASS_METHOD_CONFIG,
} from '~/core/commands/canvas/members';
