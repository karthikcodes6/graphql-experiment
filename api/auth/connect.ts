/**
 * @copyright 2016-present Kriasoft (https://git.io/Jt7GM)
 */

import type { Identity, User } from "db";
import { Request } from "express";
import { graphql } from "graphql";
import { Context } from "../context";
import db from "../db";
import { schema } from "../schema";
import { newUserId } from "../utils";

/**
 * Links OAuth credentials (identity) to a user account.
 */
export default async function connect(
  req: Request,
  identity: Partial<Omit<Identity, "user_id">>,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
): Promise<any | null> {
  // Get the currently authenticated user from session
  let user: User | null | undefined = req.user;

  // If user is not authenticated, find user by credentials
  if (!user) {
    user = await db
      .table<Identity>("identity")
      .leftJoin<User>("user", "user.id", "identity.user_id")
      .where({
        "identity.id": identity.id,
        "identity.provider": identity.provider,
      } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .first<User>("user.*");
  }

  // Otherwise, find user account by email
  if (!user && identity.email && identity.email_verified !== false) {
    user = await db
      .table<User>("user")
      .where({ email: identity.email })
      .orderBy("email_verified", "desc")
      .first();
  }

  // Alternatively, create a new user account
  if (!user) {
    const userId = await newUserId(true);
    [user] = await db
      .table<User>("user")
      .insert({
        id: userId,
        username: userId,
        email: identity.email,
        email_verified: identity.email_verified ?? false,
        name: identity.name,
        picture: identity.picture,
        given_name: identity.given_name,
        family_name: identity.family_name,
        locale: identity.locale,
      })
      .returning("*");
  }

  // Link credentials to user account
  if (user) {
    const key = { provider: identity.provider, id: identity.id };
    const dbIdentity = await db.table<Identity>("identity").where(key).first();

    if (dbIdentity) {
      if (dbIdentity.user_id !== user.id) {
        throw new Error(
          "These credentials already linked to another user account.",
        );
      }

      await db
        .table<Identity>("identity")
        .where(key)
        .update({
          ...identity,
          user_id: user.id,
          updated_at: db.fn.now(),
        });
    } else {
      await db.table<Identity>("identity").insert({
        ...identity,
        user_id: user.id,
      });
    }
  }

  await req.signIn(user);

  return graphql({
    schema,
    contextValue: new Context(req),
    source: `
      query {
        me {
          __typename
          id
          username
          email
          emailVerified
          name
          picture
          givenName
          familyName
          timeZone
          locale
          createdAt
          updatedAt
          lastLogin
        }
      }
    `,
  }).then(({ data, errors }) => {
    const err = errors?.[0];
    if (err) throw err.originalError || err;
    return data;
  });
}
