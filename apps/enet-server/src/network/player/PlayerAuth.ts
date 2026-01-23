import type { Server } from "@/core/Server";
import { Debug, ThrowError } from "@/decorators";
import type { UserDocument } from "@growserver/db";

export default class PlayerAuth {

  constructor(private server: Server) {}

  @Debug()
  @ThrowError("Failed to validating ltoken")
  public async validateToken(token: string) {
    const sessionData = await this.getUserSession(token);
    
    if (!sessionData) {
      return null;
    }
    
    const user = sessionData.userId as UserDocument;
    const player = user?.playerId || null;
    
    return { session: sessionData, user, player };
  }

  @Debug()
  @ThrowError("Failed to get session data")
  public async getUserSession(token: string) {
    const sessionData = await this.server.database.models.Session.findOne({ token })
      .populate({
        path:     'userId',
        model:    'User',
        populate: {
          path:  'playerId',
          model: 'Player'
        }
      });
    
    if (!sessionData) {
      return null;
    }

    // Check if session is expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      return null;
    }

    return sessionData;
  }

}
