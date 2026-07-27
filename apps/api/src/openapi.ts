import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ErrorResponseSchema, HealthResponseSchema, ReadinessResponseSchema } from "./schemas.js";

const registry = new OpenAPIRegistry();
registry.register("ErrorResponse", ErrorResponseSchema);

const AuthRequestSchema = z.record(z.string(), z.string()).openapi("AuthRequest");
const AuthResultSchema = z
  .object({
    message: z.string(),
    verificationRequired: z.boolean().optional()
  })
  .openapi("AuthResult");
registry.register("AuthRequest", AuthRequestSchema);
registry.register("AuthResult", AuthResultSchema);

const UserPreferencesSchema = z
  .object({
    theme: z.enum(["system", "light", "dark"]),
    locale: z.string().min(2).max(20),
    reducedMotion: z.boolean(),
    emailNotifications: z.boolean()
  })
  .strict()
  .openapi("UserPreferences");
const UserProfileSchema = z
  .object({
    userId: z.string(),
    email: z.string().email(),
    displayName: z.string().min(1).max(120),
    avatarUrl: z.string().url().nullable(),
    timezone: z.string().min(1).max(64),
    preferences: UserPreferencesSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()
  .openapi("UserProfile");
const UserProfilePatchSchema = z
  .object({
    displayName: z.string().min(1).max(120).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    timezone: z.string().min(1).max(64).optional(),
    preferences: UserPreferencesSchema.optional()
  })
  .strict()
  .openapi("UserProfilePatch");
registry.register("UserPreferences", UserPreferencesSchema);
registry.register("UserProfile", UserProfileSchema);
registry.register("UserProfilePatch", UserProfilePatchSchema);

const WorkspaceSummarySchema = z
  .object({
    organizationId: z.string(),
    organizationName: z.string().min(1).max(200),
    workspaceId: z.string(),
    workspaceName: z.string().min(1).max(200),
    slug: z.string().min(1).max(63),
    role: z.enum(["owner", "admin", "editor", "viewer"]),
    createdAt: z.string().datetime()
  })
  .strict()
  .openapi("WorkspaceSummary");
const WorkspaceCreateSchema = z
  .object({
    organizationName: z.string().min(1).max(200),
    workspaceName: z.string().min(1).max(200),
    slug: z.string().min(1).max(63)
  })
  .strict()
  .openapi("WorkspaceCreate");
registry.register("WorkspaceSummary", WorkspaceSummarySchema);
registry.register("WorkspaceCreate", WorkspaceCreateSchema);
const MembershipMessageSchema = z
  .object({ message: z.string().min(1).max(240) })
  .strict()
  .openapi("MembershipMessage");
const InvitationCreateSchema = z
  .object({
    email: z.string().email(),
    role: z.enum(["admin", "editor", "viewer"])
  })
  .strict()
  .openapi("InvitationCreate");
const InvitationAcceptSchema = z
  .object({ token: z.string().min(32).max(256) })
  .strict()
  .openapi("InvitationAccept");
const WorkspaceMemberSchema = z
  .object({
    userId: z.string(),
    workspaceId: z.string(),
    email: z.string().email(),
    displayName: z.string().min(1).max(120),
    avatarUrl: z.string().url().nullable(),
    role: z.enum(["owner", "admin", "editor", "viewer"]),
    joinedAt: z.string().datetime()
  })
  .strict()
  .openapi("WorkspaceMember");
const WorkspaceInvitationSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    folderId: z.string().nullable(),
    email: z.string().email(),
    role: z.enum(["admin", "editor", "viewer"]),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime()
  })
  .strict()
  .openapi("WorkspaceInvitation");
const WorkspaceAuditEventSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    action: z.enum([
      "member.invited",
      "member.role_changed",
      "member.removed",
      "invitation.revoked"
    ]),
    actorUserId: z.string(),
    targetUserId: z.string().nullable(),
    invitationId: z.string().nullable(),
    createdAt: z.string().datetime()
  })
  .strict()
  .openapi("WorkspaceAuditEvent");
registry.register("MembershipMessage", MembershipMessageSchema);
registry.register("InvitationCreate", InvitationCreateSchema);
registry.register("InvitationAccept", InvitationAcceptSchema);
registry.register("WorkspaceMember", WorkspaceMemberSchema);
registry.register("WorkspaceInvitation", WorkspaceInvitationSchema);
registry.register("WorkspaceAuditEvent", WorkspaceAuditEventSchema);

const DemoSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    folderId: z.string().nullable(),
    ownerUserId: z.string(),
    title: z.string().min(1).max(200),
    description: z.string().max(4000).nullable(),
    type: z.enum(["guided_html", "screenshot", "video", "sandbox"]),
    status: z.enum(["draft", "processing", "published", "failed", "needs_update", "archived"]),
    isTemplate: z.boolean(),
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable()
  })
  .strict()
  .openapi("Demo");
const DemoCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(4000).nullable(),
    type: z.enum(["guided_html", "screenshot", "video", "sandbox"])
  })
  .strict()
  .openapi("DemoCreate");
const DemoPatchSchema = DemoCreateSchema.partial()
  .refine((value) => Object.keys(value).length > 0)
  .openapi("DemoPatch");
const DemoStatusSchema = z
  .object({
    status: z.enum(["draft", "processing", "published", "failed", "needs_update", "archived"])
  })
  .strict()
  .openapi("DemoStatusUpdate");
const DemoMessageSchema = z
  .object({ message: z.string().min(1).max(240) })
  .strict()
  .openapi("DemoMessage");
const TrashItemSchema = z
  .object({
    demo: DemoSchema,
    deletedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    daysRemaining: z.number().int().min(0)
  })
  .strict()
  .openapi("TrashItem");
const DuplicateDemoSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    folderId: z.string().nullable().optional()
  })
  .strict()
  .openapi("DuplicateDemo");
const SetDemoTemplateSchema = z
  .object({
    isTemplate: z.boolean()
  })
  .strict()
  .openapi("SetDemoTemplate");
const CreateFromTemplateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    folderId: z.string().nullable().optional()
  })
  .strict()
  .openapi("CreateFromTemplate");
registry.register("Demo", DemoSchema);
registry.register("DemoCreate", DemoCreateSchema);
registry.register("DemoPatch", DemoPatchSchema);
registry.register("DemoStatusUpdate", DemoStatusSchema);
registry.register("DemoMessage", DemoMessageSchema);
registry.register("TrashItem", TrashItemSchema);
registry.register("DuplicateDemo", DuplicateDemoSchema);
registry.register("SetDemoTemplate", SetDemoTemplateSchema);
registry.register("CreateFromTemplate", CreateFromTemplateSchema);

const FolderSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    parentId: z.string().nullable(),
    name: z.string().min(1).max(120),
    version: z.number().int().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()
  .openapi("Folder");
const FolderCreateSchema = z
  .object({ name: z.string().min(1).max(120), parentId: z.string().nullable() })
  .strict()
  .openapi("FolderCreate");
const FolderUpdateSchema = z
  .object({ name: z.string().min(1).max(120), expectedVersion: z.number().int().min(1) })
  .strict()
  .openapi("FolderUpdate");
const FolderMoveSchema = z
  .object({ parentId: z.string().nullable(), expectedVersion: z.number().int().min(1) })
  .strict()
  .openapi("FolderMove");
const FolderDeleteSchema = z
  .object({ expectedVersion: z.number().int().min(1) })
  .strict()
  .openapi("FolderDelete");
const DemoFolderSchema = z
  .object({ folderId: z.string().nullable() })
  .strict()
  .openapi("DemoFolder");
registry.register("Folder", FolderSchema);
registry.register("FolderCreate", FolderCreateSchema);
registry.register("FolderUpdate", FolderUpdateSchema);
registry.register("FolderMove", FolderMoveSchema);
registry.register("FolderDelete", FolderDeleteSchema);
registry.register("DemoFolder", DemoFolderSchema);

const TagSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string().min(1).max(80),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
  })
  .strict()
  .openapi("Tag");
const TagCreateSchema = z
  .object({ name: z.string().min(1).max(80) })
  .strict()
  .openapi("TagCreate");
registry.register("Tag", TagSchema);
registry.register("TagCreate", TagCreateSchema);

const DemoPathSchema = z
  .object({ workspaceId: z.string(), demoId: z.string().optional() })
  .strict()
  .openapi("DemoPath");

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/demos",
  summary: "List active demos in a workspace",
  request: {
    params: z.object({ workspaceId: z.string() }).strict(),
    query: z
      .object({
        q: z.string().max(200).optional(),
        owner: z.string().uuid().optional(),
        type: z.enum(["guided_html", "screenshot", "video", "sandbox"]).optional(),
        status: z
          .enum(["draft", "processing", "published", "failed", "needs_update", "archived"])
          .optional(),
        tag: z.string().max(369).optional(),
        updatedAfter: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/u)
          .optional(),
        updatedBefore: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/u)
          .optional()
      })
      .strict()
  },
  responses: {
    200: {
      description: "Active workspace demos.",
      content: { "application/json": { schema: z.array(DemoSchema) } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot view demos.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/tags",
  summary: "List workspace tags",
  request: { params: z.object({ workspaceId: z.string() }).strict() },
  responses: {
    200: {
      description: "Workspace tags.",
      content: { "application/json": { schema: z.array(TagSchema) } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot view tags.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/tags",
  summary: "Create an idempotent workspace tag",
  request: {
    params: z.object({ workspaceId: z.string() }).strict(),
    headers: z.object({ "idempotency-key": z.string().min(1).max(128) }).strict(),
    body: { required: true, content: { "application/json": { schema: TagCreateSchema } } }
  },
  responses: {
    201: { description: "The new tag.", content: { "application/json": { schema: TagSchema } } },
    400: {
      description: "The request is invalid.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot create tags.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    409: {
      description: "The tag or idempotency request conflicts.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

for (const method of ["post", "delete"] as const) {
  registry.registerPath({
    method,
    path: "/api/v1/workspaces/{workspaceId}/tags/{tagId}/demos/{demoId}",
    summary: method === "post" ? "Apply a tag to a demo" : "Remove a tag from a demo",
    request: {
      params: z.object({ workspaceId: z.string(), tagId: z.string(), demoId: z.string() }).strict()
    },
    responses: {
      200: {
        description: "The demo tag was updated.",
        content: { "application/json": { schema: DemoMessageSchema } }
      },
      400: {
        description: "The request is invalid.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      401: {
        description: "Authentication is required.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      403: {
        description: "The actor cannot update this demo.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      404: {
        description: "The demo or tag was not found in this workspace.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      }
    }
  });
}

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/demos",
  summary: "Create an idempotent draft demo",
  request: {
    params: z.object({ workspaceId: z.string() }).strict(),
    headers: z.object({ "idempotency-key": z.string().min(1).max(128) }).strict(),
    body: { required: true, content: { "application/json": { schema: DemoCreateSchema } } }
  },
  responses: {
    201: {
      description: "The draft demo.",
      content: { "application/json": { schema: DemoSchema } }
    },
    400: {
      description: "The request is invalid.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot create demos.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    409: {
      description: "The idempotency request conflicts.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

for (const [method, path, summary, body, success] of [
  [
    "get",
    "/api/v1/workspaces/{workspaceId}/trash",
    "List trashed demos in a workspace",
    undefined,
    z.array(TrashItemSchema)
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/folder",
    "Move a demo into a folder or Unfiled",
    DemoFolderSchema,
    DemoSchema
  ],
  [
    "get",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}",
    "Get an active demo",
    undefined,
    DemoSchema
  ],
  [
    "patch",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}",
    "Update demo metadata",
    DemoPatchSchema,
    DemoSchema
  ],
  [
    "delete",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}",
    "Move a demo to trash",
    undefined,
    DemoMessageSchema
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/status",
    "Transition demo status",
    DemoStatusSchema,
    DemoSchema
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/archive",
    "Archive a demo",
    undefined,
    DemoSchema
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/unarchive",
    "Unarchive a demo",
    undefined,
    DemoSchema
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/restore",
    "Restore a trashed demo",
    undefined,
    DemoSchema
  ],
  [
    "delete",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/permanent",
    "Permanently delete a trashed demo",
    undefined,
    DemoMessageSchema
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/duplicate",
    "Duplicate a demo",
    DuplicateDemoSchema,
    DemoSchema
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/template",
    "Designate or remove demo template state",
    SetDemoTemplateSchema,
    DemoSchema
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/demos/{demoId}/instantiate",
    "Create a new demo from a template",
    CreateFromTemplateSchema,
    DemoSchema
  ]
] as const) {
  registry.registerPath({
    method,
    path,
    summary,
    request: {
      params: DemoPathSchema,
      ...(body
        ? { body: { required: true, content: { "application/json": { schema: body } } } }
        : {})
    },
    responses: {
      200: {
        description: "The demo operation completed.",
        content: { "application/json": { schema: success } }
      },
      401: {
        description: "Authentication is required.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      403: {
        description: "The actor cannot perform this operation.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      404: {
        description: "The demo was not found in this workspace.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      409: {
        description: "The status transition or mutation conflicts.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      }
    }
  });
}

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/folders",
  summary: "List folders in a workspace",
  request: { params: z.object({ workspaceId: z.string() }).strict() },
  responses: {
    200: {
      description: "Workspace folder tree.",
      content: { "application/json": { schema: z.array(FolderSchema) } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot view folders.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/folders",
  summary: "Create an idempotent folder",
  request: {
    params: z.object({ workspaceId: z.string() }).strict(),
    headers: z.object({ "idempotency-key": z.string().min(1).max(128) }).strict(),
    body: { required: true, content: { "application/json": { schema: FolderCreateSchema } } }
  },
  responses: {
    201: {
      description: "The new folder.",
      content: { "application/json": { schema: FolderSchema } }
    },
    400: {
      description: "The request is invalid.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot create folders.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    409: {
      description: "The idempotency request conflicts.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

for (const [method, path, summary, body, success] of [
  [
    "patch",
    "/api/v1/workspaces/{workspaceId}/folders/{folderId}",
    "Rename a folder",
    FolderUpdateSchema,
    FolderSchema
  ],
  [
    "delete",
    "/api/v1/workspaces/{workspaceId}/folders/{folderId}",
    "Delete a folder and preserve its direct contents",
    FolderDeleteSchema,
    DemoMessageSchema
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/folders/{folderId}/move",
    "Move a folder",
    FolderMoveSchema,
    FolderSchema
  ]
] as const) {
  registry.registerPath({
    method,
    path,
    summary,
    request: {
      params: z.object({ workspaceId: z.string(), folderId: z.string() }).strict(),
      body: { required: true, content: { "application/json": { schema: body } } }
    },
    responses: {
      200: {
        description: "The folder operation completed.",
        content: { "application/json": { schema: success } }
      },
      400: {
        description: "The request is invalid.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      401: {
        description: "Authentication is required.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      403: {
        description: "The actor cannot perform this operation.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      404: {
        description: "The folder was not found in this workspace.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      409: {
        description: "The folder changed or the requested hierarchy is invalid.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      }
    }
  });
}

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  summary: "Check API liveness",
  responses: {
    200: {
      description: "The API process is alive.",
      content: { "application/json": { schema: HealthResponseSchema } }
    },
    404: {
      description: "The resource was not found.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/current",
  summary: "Get the current workspace",
  responses: {
    200: {
      description: "The current workspace.",
      content: { "application/json": { schema: WorkspaceSummarySchema } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    404: {
      description: "No workspace is available.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "put",
  path: "/api/v1/workspaces/current",
  summary: "Set the current workspace",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: z.object({ workspaceId: z.string() }).strict() } }
    }
  },
  responses: {
    200: {
      description: "The selected workspace.",
      content: { "application/json": { schema: WorkspaceSummarySchema } }
    },
    400: {
      description: "The request is invalid.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    404: {
      description: "The workspace was not found.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/members",
  summary: "List workspace members",
  request: { params: z.object({ workspaceId: z.string() }).strict() },
  responses: {
    200: {
      description: "Workspace members.",
      content: { "application/json": { schema: z.array(WorkspaceMemberSchema) } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot view members.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/invitations/pending",
  summary: "List pending workspace invitations",
  request: { params: z.object({ workspaceId: z.string() }).strict() },
  responses: {
    200: {
      description: "Pending invitations.",
      content: { "application/json": { schema: z.array(WorkspaceInvitationSchema) } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot view invitations.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/audit-events",
  summary: "List recent workspace membership audit events",
  request: { params: z.object({ workspaceId: z.string() }).strict() },
  responses: {
    200: {
      description: "Recent audit events.",
      content: { "application/json": { schema: z.array(WorkspaceAuditEventSchema) } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot view audit events.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/workspaces/{workspaceId}/members/{memberId}",
  summary: "Change a workspace member role",
  request: {
    params: z.object({ workspaceId: z.string(), memberId: z.string() }).strict(),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({ role: z.enum(["admin", "editor", "viewer"]) }).strict()
        }
      }
    }
  },
  responses: {
    200: {
      description: "The updated member.",
      content: { "application/json": { schema: WorkspaceMemberSchema } }
    },
    403: {
      description: "The actor cannot change the role.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    409: {
      description: "The member role cannot be changed.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/invitations/accept",
  summary: "Accept a workspace invitation",
  request: {
    body: { required: true, content: { "application/json": { schema: InvitationAcceptSchema } } }
  },
  responses: {
    200: {
      description: "The invitation was accepted.",
      content: { "application/json": { schema: WorkspaceSummarySchema } }
    },
    400: {
      description: "The invitation is invalid or expired.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/invitations",
  summary: "Invite a member to a workspace",
  request: {
    params: z.object({ workspaceId: z.string() }).strict(),
    body: { required: true, content: { "application/json": { schema: InvitationCreateSchema } } }
  },
  responses: {
    202: {
      description: "The invitation is being sent.",
      content: { "application/json": { schema: MembershipMessageSchema } }
    },
    400: {
      description: "The invitation is invalid.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    403: {
      description: "The actor cannot invite members.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

for (const [method, path, summary] of [
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/invitations/{invitationId}/resend",
    "Resend a workspace invitation"
  ],
  [
    "post",
    "/api/v1/workspaces/{workspaceId}/invitations/{invitationId}/revoke",
    "Revoke a workspace invitation"
  ],
  ["post", "/api/v1/workspaces/{workspaceId}/leave", "Leave a workspace"]
] as const) {
  registry.registerPath({
    method,
    path,
    summary,
    request: {
      params: z
        .object({
          workspaceId: z.string(),
          invitationId: z.string().optional(),
          memberId: z.string().optional()
        })
        .strict()
        .openapi("MembershipPath")
    },
    responses: {
      200: {
        description: "The membership action completed.",
        content: { "application/json": { schema: MembershipMessageSchema } }
      },
      403: {
        description: "The actor cannot perform the action.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      409: {
        description: "The action would violate membership rules.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      }
    }
  });
}

registry.registerPath({
  method: "delete",
  path: "/api/v1/workspaces/{workspaceId}/members/{memberId}",
  summary: "Remove a workspace member",
  request: {
    params: z
      .object({ workspaceId: z.string(), memberId: z.string() })
      .strict()
      .openapi("MemberPath")
  },
  responses: {
    200: {
      description: "The member was removed.",
      content: { "application/json": { schema: MembershipMessageSchema } }
    },
    403: {
      description: "The actor cannot remove members.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    409: {
      description: "The final owner cannot be removed.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces",
  summary: "List workspaces for the authenticated user",
  responses: {
    200: {
      description: "The authenticated user's workspaces.",
      content: {
        "application/json": { schema: z.array(WorkspaceSummarySchema) }
      }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    503: {
      description: "The workspace service is unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces",
  summary: "Create a workspace and owner membership",
  request: {
    headers: z.object({ "idempotency-key": z.string().min(1).max(128) }).strict(),
    body: {
      required: true,
      content: { "application/json": { schema: WorkspaceCreateSchema } }
    }
  },
  responses: {
    201: {
      description: "The workspace and owner membership were created.",
      content: { "application/json": { schema: WorkspaceSummarySchema } }
    },
    400: {
      description: "The workspace request is invalid.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    409: {
      description: "The idempotency key or workspace values conflict.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    503: {
      description: "The workspace service is unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

for (const path of [
  "/api/v1/auth/sign-up",
  "/api/v1/auth/verify-email",
  "/api/v1/auth/sign-in",
  "/api/v1/auth/sign-out",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/refresh-session"
] as const) {
  registry.registerPath({
    method: "post",
    path,
    summary: "Run an account authentication workflow",
    request: {
      body: {
        required: true,
        content: { "application/json": { schema: AuthRequestSchema } }
      }
    },
    responses: {
      200: {
        description: "The workflow completed.",
        content: { "application/json": { schema: AuthResultSchema } }
      },
      400: {
        description: "The request is invalid.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      401: {
        description: "The credentials are invalid.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      429: {
        description: "The request is rate limited.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      },
      503: {
        description: "The authentication provider is unavailable.",
        content: { "application/json": { schema: ErrorResponseSchema } }
      }
    }
  });
}

registry.registerPath({
  method: "get",
  path: "/api/v1/me/profile",
  summary: "Get the authenticated user profile",
  responses: {
    200: {
      description: "The authenticated user profile.",
      content: { "application/json": { schema: UserProfileSchema } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    503: {
      description: "The profile service is unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/me/profile",
  summary: "Update the authenticated user profile",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: UserProfilePatchSchema } }
    }
  },
  responses: {
    200: {
      description: "The updated authenticated user profile.",
      content: { "application/json": { schema: UserProfileSchema } }
    },
    400: {
      description: "The profile update is invalid.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    401: {
      description: "Authentication is required.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    },
    503: {
      description: "The profile service is unavailable.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/readiness",
  summary: "Check dependency readiness",
  responses: {
    200: {
      description: "All required dependencies are ready.",
      content: { "application/json": { schema: ReadinessResponseSchema } }
    },
    503: {
      description: "One or more required dependencies are unavailable.",
      content: { "application/json": { schema: ReadinessResponseSchema } }
    },
    404: {
      description: "The resource was not found.",
      content: { "application/json": { schema: ErrorResponseSchema } }
    }
  }
});

const CommentReactionSchema = z
  .object({
    emoji: z.string().min(1).max(16),
    userIds: z.array(z.string().uuid())
  })
  .strict()
  .openapi("CommentReaction");

const CommentSchema = z
  .object({
    id: z.string().uuid(),
    workspaceId: z.string().uuid(),
    targetType: z.enum(["demo", "step"]),
    targetId: z.string().uuid(),
    threadId: z.string().uuid(),
    parentId: z.string().uuid().nullable(),
    authorUserId: z.string().uuid(),
    content: z.string().min(1).max(2000),
    mentions: z.array(z.string().uuid()),
    reactions: z.array(CommentReactionSchema),
    isResolved: z.boolean(),
    resolvedByUserId: z.string().uuid().nullable(),
    resolvedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable()
  })
  .strict()
  .openapi("Comment");

const CreateCommentSchema = z
  .object({
    targetType: z.enum(["demo", "step"]),
    targetId: z.string().uuid(),
    content: z.string().min(1).max(2000),
    parentId: z.string().uuid().nullable().optional(),
    mentions: z.array(z.string().uuid()).max(10).optional()
  })
  .strict()
  .openapi("CreateComment");

const UpdateCommentSchema = z
  .object({
    content: z.string().min(1).max(2000)
  })
  .strict()
  .openapi("UpdateComment");

const ToggleResolveCommentSchema = z
  .object({
    isResolved: z.boolean()
  })
  .strict()
  .openapi("ToggleResolveComment");

const ToggleCommentReactionSchema = z
  .object({
    emoji: z.string().min(1).max(16)
  })
  .strict()
  .openapi("ToggleCommentReaction");

registry.register("CommentReaction", CommentReactionSchema);
registry.register("Comment", CommentSchema);
registry.register("CreateComment", CreateCommentSchema);
registry.register("UpdateComment", UpdateCommentSchema);
registry.register("ToggleResolveComment", ToggleResolveCommentSchema);
registry.register("ToggleCommentReaction", ToggleCommentReactionSchema);

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/comments",
  summary: "List target comments",
  request: {
    params: z.object({ workspaceId: z.string().uuid() }),
    query: z.object({ targetType: z.enum(["demo", "step"]), targetId: z.string().uuid() })
  },
  responses: {
    200: {
      description: "List of comments",
      content: { "application/json": { schema: z.array(CommentSchema) } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/comments",
  summary: "Create comment",
  request: {
    params: z.object({ workspaceId: z.string().uuid() }),
    body: { content: { "application/json": { schema: CreateCommentSchema } } }
  },
  responses: {
    201: {
      description: "Created comment",
      content: { "application/json": { schema: CommentSchema } }
    }
  }
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/workspaces/{workspaceId}/comments/{commentId}",
  summary: "Update comment",
  request: {
    params: z.object({ workspaceId: z.string().uuid(), commentId: z.string().uuid() }),
    body: { content: { "application/json": { schema: UpdateCommentSchema } } }
  },
  responses: {
    200: {
      description: "Updated comment",
      content: { "application/json": { schema: CommentSchema } }
    }
  }
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/workspaces/{workspaceId}/comments/{commentId}",
  summary: "Delete comment",
  request: {
    params: z.object({ workspaceId: z.string().uuid(), commentId: z.string().uuid() })
  },
  responses: {
    200: {
      description: "Comment deleted",
      content: { "application/json": { schema: z.object({ success: z.literal(true) }) } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/comments/{commentId}/resolve",
  summary: "Toggle resolve state",
  request: {
    params: z.object({ workspaceId: z.string().uuid(), commentId: z.string().uuid() }),
    body: { content: { "application/json": { schema: ToggleResolveCommentSchema } } }
  },
  responses: {
    200: {
      description: "Comment resolve toggled",
      content: { "application/json": { schema: CommentSchema } }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/comments/{commentId}/reactions",
  summary: "Toggle reaction",
  request: {
    params: z.object({ workspaceId: z.string().uuid(), commentId: z.string().uuid() }),
    body: { content: { "application/json": { schema: ToggleCommentReactionSchema } } }
  },
  responses: {
    200: {
      description: "Reaction toggled",
      content: { "application/json": { schema: CommentSchema } }
    }
  }
});

const NotificationSchema = z
  .object({
    id: z.string().uuid(),
    workspaceId: z.string().uuid(),
    recipientUserId: z.string().uuid(),
    actorUserId: z.string().uuid(),
    type: z.enum([
      "comment_mention",
      "comment_reply",
      "workspace_invite",
      "review_requested",
      "review_approved",
      "review_changes_requested"
    ]),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    targetType: z.enum(["demo", "step", "workspace", "comment"]),
    targetId: z.string().uuid(),
    isRead: z.boolean(),
    readAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime()
  })
  .strict()
  .openapi("Notification");

registry.register("Notification", NotificationSchema);

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/notifications",
  summary: "List user notifications",
  request: {
    params: z.object({ workspaceId: z.string().uuid() }),
    query: z.object({ unreadOnly: z.enum(["true", "false"]).optional() })
  },
  responses: {
    200: {
      description: "List of notifications",
      content: { "application/json": { schema: z.array(NotificationSchema) } }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/workspaces/{workspaceId}/notifications/unread-count",
  summary: "Get unread notifications count",
  request: {
    params: z.object({ workspaceId: z.string().uuid() })
  },
  responses: {
    200: {
      description: "Unread notifications count",
      content: {
        "application/json": { schema: z.object({ unreadCount: z.number().int().min(0) }) }
      }
    }
  }
});

registry.registerPath({
  method: "post",
  path: "/api/v1/workspaces/{workspaceId}/notifications/mark-read",
  summary: "Mark notifications as read",
  request: {
    params: z.object({ workspaceId: z.string().uuid() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ notificationId: z.string().uuid().nullable().optional() })
        }
      }
    }
  },
  responses: {
    200: {
      description: "Updated notification count",
      content: {
        "application/json": { schema: z.object({ updatedCount: z.number().int().min(0) }) }
      }
    }
  }
});

registry.registerPath({
  method: "get",
  path: "/api/v1/openapi.json",
  summary: "Get the API contract",
  responses: {
    200: {
      description: "The generated OpenAPI document.",
      content: { "application/json": { schema: { type: "object" } } }
    }
  }
});

export function createOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Supademo Platform API",
      version: "0.1.0",
      description: "Versioned HTTP API contract for the Supademo-style platform."
    },
    servers: [{ url: "/" }]
  });
}
