import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

/**
 * generally I don't know what I'm doing here.
 * I'm creating a seperate item for a single ID vs multiple, but feel like it could be combined? we will see
 */

export const usersRouter = createTRPCRouter({
  playerById: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.user.findUnique({
      where: {
        id: input,
      },
      // select: {
      //     id: true,
      //     image: true,
      //     name: true,
      // }
    });
  }),
  playersByIds: protectedProcedure
    .input(z.object({ players: z.string().array() }))
    .query(({ ctx, input }) => {
      return ctx.db.user.findMany({
        where: {
          id: {
            in: input.players,
          },
        },
      });
    }),
});
