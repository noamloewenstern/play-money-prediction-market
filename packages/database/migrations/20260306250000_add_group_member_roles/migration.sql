-- Add MODERATOR and CONTRIBUTOR roles to GroupMemberRole enum
ALTER TYPE "GroupMemberRole" ADD VALUE 'MODERATOR';
ALTER TYPE "GroupMemberRole" ADD VALUE 'CONTRIBUTOR';
