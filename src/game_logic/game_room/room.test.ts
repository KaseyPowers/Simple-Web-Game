/* disabled ot notation for accessing private/protected values in test */
/* eslint-disable @typescript-eslint/dot-notation */

import GameRoom from "./room";
import type { ChatDataI } from "./room_types";

import cryptoRandomString from "crypto-random-string";

jest.mock("crypto-random-string");

const mockedRandomString = jest.mocked(cryptoRandomString);
// const mockedRandomString: jest.Mocked<typeof cryptoRandomString> = jest.mocked(cryptoRandomString);

// super simple implementation, a number that increments and return a string for it
let roomCount = 0;
mockedRandomString.mockImplementation(() => {     
            roomCount += 1;
            return `room_id_${roomCount}`;      
  });

  
// const cryptoRandomString = require("crypto-random-string");

describe("GameRoom class", () => {
    beforeEach(() => {
        // reset the room data between tests
        GameRoom['allRoomsData'] = {};
    });

    it("can construct", () => {
        const testRoom = new GameRoom("test_user");
        expect(testRoom).toBeDefined();
    })

    it("constructor generates unique roomId", () => {
        const room1 = new GameRoom("test_user");
        expect(room1.roomId).toBeDefined();
        const room2 = new GameRoom("test_user");
        expect(room2.roomId).toBeDefined();
        expect(room1.roomId).not.toBe(room2.roomId);
    });

    it("new rooms auto assign provided userId to players array", () => {
        const userId = "test_user";
        const testRoom = new GameRoom(userId);
        expect(testRoom['players']).toEqual([userId]);
        expect(testRoom['playersOnline']).toEqual({[userId]: true});
    });

    it("new room should be available from static lookups", () => {
        const userId = "test_user";
        const testRoom = new GameRoom(userId);
        const foundRoom = GameRoom.findRoom(testRoom.roomId);
        expect(foundRoom).toBeDefined();
        expect(foundRoom).toBe(testRoom);
    });

    it("static closeRoom removes room from static tracking", () => {
        const userId = "test_user";
        const testRoom = new GameRoom(userId);
        const {roomId} = testRoom;
        const roomBeforeClose = GameRoom.findRoom(roomId);
        expect(roomBeforeClose).toBeDefined();
        expect(roomBeforeClose).toBe(testRoom);

        GameRoom.closeRoom(roomId);
        const roomAfterClose = GameRoom.findRoom(roomId);
        expect(roomAfterClose).not.toBeDefined();
        // room still exists 
        // NOTE: This is expected behavior?
        expect(testRoom).toBeDefined();
    });

    it("room's closeRoom removes itself from static tracking", () => {
        const userId = "test_user";
        const testRoom = new GameRoom(userId);
        const {roomId} = testRoom;
        const roomBeforeClose = GameRoom.findRoom(roomId);
        expect(roomBeforeClose).toBeDefined();
        expect(roomBeforeClose).toBe(testRoom);

        testRoom.closeRoom();
        const roomAfterClose = GameRoom.findRoom(roomId);
        expect(roomAfterClose).not.toBeDefined();
        // room still exists 
        // NOTE: This is expected behavior?
        expect(testRoom).toBeDefined();
    });

    it("should throw an error if a new room's generated id already exists", () => {
        const useRoomId = "room_id_repeat";
        mockedRandomString.mockReturnValueOnce(useRoomId).mockReturnValueOnce(useRoomId);

        const userId = "test_user";
        const testRoom = new GameRoom(userId);
        expect(testRoom['players']).toEqual([userId]);
        expect(testRoom['playersOnline']).toEqual({[userId]: true});
        expect(testRoom.roomId).toBe(useRoomId);

        expect(() => {
            new GameRoom(userId);
        }).toThrow("Somehow created a room for an id that already exists!");
    })
    it.todo("Mock crypto to verify error when creating two rooms that get the same room id?");

    describe("Get Data Objects", () => {
        it("getPlayerData", () => {
            const userId = "test_user";
            const testRoom = new GameRoom(userId);

            expect(testRoom.getPlayerData()).toEqual({
                players: [userId],
                playersOnline: {
                    [userId]: true
                }
            });

            const secondUser = "test_second_user";
            // using addPlayer because it is simple and updates the online statuses
            testRoom.addPlayer(secondUser);            

            expect(testRoom.getPlayerData()).toEqual({
                players: [userId, secondUser],
                playersOnline: {
                    [userId]: true,
                    [secondUser]: true
                }
            });
        });

        it("getData", () => {
            const userId = "test_user";
            const testRoom = new GameRoom(userId);

            expect(testRoom.getData()).toEqual({
                // might be redundant getting roomId this way. Could change this if we start mocking the crypto library for getting ids
                roomId: testRoom.roomId,
                chat: [],
                players: [userId],
                playersOnline: {
                    [userId]: true
                }
            });

            const secondUser = "test_second_user";
            // using addPlayer because it is simple and updates the online statuses
            testRoom.addPlayer(secondUser); 
            // using addChatMessage because modifying values directly feels like cheating, even though this test isn't for that function
            const testMsg: ChatDataI = {
                roomId: testRoom.roomId,
                userId,
                msg: "test string msg"
            };
            testRoom.addChatMessage(testMsg);
            
            expect(testRoom.getData()).toEqual({
                roomId: testRoom.roomId,
                chat: [testMsg],
                players: [userId, secondUser],
                playersOnline: {
                    [userId]: true,
                    [secondUser]: true
                }
            });
        });
    });

    
    describe("add and remove players", () => {

        it("addPlayer should add user to players array", () => {        
            const userId = "test_user";              
            const secondUser = "test_second_user";            
            const testRoom = new GameRoom(userId);
            expect(testRoom["players"]).toEqual([userId]);  
            testRoom.addPlayer(secondUser);              
            expect(testRoom["players"]).toEqual([userId, secondUser]);          
        });

        
        it("addPlayer should ignore adding a player more than once (duplicate events)", () => {        
            const userId = "test_user";              
            const secondUser = "test_second_user";
            
            const testRoom = new GameRoom(userId);
            expect(testRoom["players"]).toEqual([userId]);  
            testRoom.addPlayer(secondUser);              
            expect(testRoom["players"]).toEqual([userId, secondUser]);              
            testRoom.addPlayer(secondUser);              
            expect(testRoom["players"]).toEqual([userId, secondUser]);          
        });

        it("addPlayer should automatically add an online status", () => {
            const userId = "test_user";              
            const secondUser = "test_second_user";
            
            const testRoom = new GameRoom(userId); 
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true
            });
            testRoom.addPlayer(secondUser);              
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true,
                [secondUser]: true
            });
        });

        it("addPlayer should return true if player is added", () => {
            const userId = "test_user";              
            const secondUser = "test_second_user";
            
            const testRoom = new GameRoom(userId);             
            expect(testRoom["players"]).toEqual([userId]);  
            // add first player again
            expect(testRoom.addPlayer(userId)).toBeFalsy();   
            expect(testRoom["players"]).toEqual([userId]);  
            // add new player
            expect(testRoom.addPlayer(secondUser)).toBeTruthy();   
            expect(testRoom["players"]).toEqual([userId, secondUser]);
            // add second player again
            expect(testRoom.addPlayer(secondUser)).toBeFalsy();   
            expect(testRoom["players"]).toEqual([userId, secondUser]);  
        });
        
        // remove players
        
        it("removePlayer should remove user from players array", () => {        
            const userId = "test_user";            
            const testRoom = new GameRoom(userId);
            expect(testRoom["players"]).toEqual([userId]);
            testRoom.removePlayer(userId);
            expect(testRoom["players"]).toEqual([]);        
        });
        
        it("removePlayer should ignore removing a player if it's not already in the room (duplicate events)", () => {        
            const userId = "test_user";              
            const secondUser = "test_second_user";
            
            const testRoom = new GameRoom(userId);
            expect(testRoom["players"]).toEqual([userId]);  
            // second user removed but hasn't been added
            testRoom.removePlayer(secondUser);
            expect(testRoom["players"]).toEqual([userId]); 
            // add second user to then verify removing it 
            testRoom.addPlayer(secondUser);              
            expect(testRoom["players"]).toEqual([userId, secondUser]); 
            testRoom.removePlayer(secondUser);
            expect(testRoom["players"]).toEqual([userId]);         
        });

        it("removePlayer should automatically remove player from online status obj", () => {
            const userId = "test_user";              
            const secondUser = "test_second_user";
            
            const testRoom = new GameRoom(userId); 
            testRoom.addPlayer(secondUser);

            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true,
                [secondUser]: true,
            });
            testRoom.removePlayer(secondUser);              
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true,
            });
        });

        it("removePlayer should return true if player was removed", () => {
            const userId = "test_user";              
            const secondUser = "test_second_user";
            
            const testRoom = new GameRoom(userId);             
            expect(testRoom["players"]).toEqual([userId]);  
            // remove second user that isn't in room
            expect(testRoom.removePlayer(secondUser)).toBeFalsy();   
            expect(testRoom["players"]).toEqual([userId]);  
            // add second player before removing
            testRoom.addPlayer(secondUser);
            expect(testRoom["players"]).toEqual([userId, secondUser]);
            // now succesfully remove the second user
            expect(testRoom.removePlayer(secondUser)).toBeTruthy();   
            expect(testRoom["players"]).toEqual([userId]);    
            // remove second user (again) even though it isn't in room
            expect(testRoom.removePlayer(secondUser)).toBeFalsy();   
            expect(testRoom["players"]).toEqual([userId]); 
        });

        it("isEmpty will return true if all players have been removed", () => {
            const userId = "test_user";              
            const secondUser = "test_second_user";
                        
            const testRoom = new GameRoom(userId);      
            // verify array is as expected to start      
            expect(testRoom["players"]).toEqual([userId]);  

            expect(testRoom.isEmpty).toBeFalsy();
            testRoom.removePlayer(secondUser);            
            expect(testRoom.isEmpty).toBeFalsy();
            testRoom.removePlayer(userId);            
            expect(testRoom.isEmpty).toBeTruthy();
            testRoom.addPlayer(userId);            
            expect(testRoom.isEmpty).toBeFalsy();            
            testRoom.addPlayer(secondUser);            
            expect(testRoom.isEmpty).toBeFalsy();
            testRoom.removePlayer(userId);      
            expect(testRoom.isEmpty).toBeFalsy();  
        });
    });

    // this is the function that actually updates the online status from the players array. Its protected and only called by the other functions and those basic behaviors are tested already. This is just checking some edge cases directly to verify
    describe('verifyOnlineObj', () => { 
        it("will add a 'true' status for any new players", () => {            
            const userId = "test_user";
            const secondUser = "test_second_user";            
            const testRoom = new GameRoom(userId);

            expect(testRoom["players"]).toEqual([userId]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true
            });
            // going to modify values directly to control when functions are called.
            testRoom["players"].push(secondUser);
            // verify setup
            expect(testRoom["players"]).toEqual([userId, secondUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true
            });
            // make call
            testRoom["verifyOnlineObj"]();
            expect(testRoom["players"]).toEqual([userId, secondUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true,
                [secondUser]: true
            });
        });

        it("can handle simultanious adds and removes (even if this shouldn't happen in practice)", () => {            
            const userId = "test_user";
            const secondUser = "test_second_user";
            const thirdUser = "test_third_user";

            const testRoom = new GameRoom(userId);
            expect(testRoom["players"]).toEqual([userId]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true
            });
            // going to modify values directly to control when functions are called.
            testRoom["players"].push(secondUser);
            // verify setup
            expect(testRoom["players"]).toEqual([userId, secondUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true
            });
            // make call
            testRoom["verifyOnlineObj"]();
            expect(testRoom["players"]).toEqual([userId, secondUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true,
                [secondUser]: true
            });

            // going to modify values directly to control when functions are called.
            testRoom["players"] = [userId, thirdUser];
            // verify setup
            expect(testRoom["players"]).toEqual([userId, thirdUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true,
                [secondUser]: true
            });
            // make call
            testRoom["verifyOnlineObj"]();
            expect(testRoom["players"]).toEqual([userId, thirdUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true,
                [thirdUser]: true
            });
        });

        it("will keep the status of an existing user", () => {            
            const userId = "test_user";
            const secondUser = "test_second_user"; 
            const thirdUser = "test_third_user";           
            const testRoom = new GameRoom(userId);

            expect(testRoom["players"]).toEqual([userId]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: true
            });
            // going to modify values directly to control when functions are called.
            testRoom["players"].push(secondUser);
            // set status to false, since default is true this is only way to verify it's not replaced with true again
            testRoom["playersOnline"][userId] = false;
            // verify setup
            expect(testRoom["players"]).toEqual([userId, secondUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: false
            });
            // make call
            testRoom["verifyOnlineObj"]();
            expect(testRoom["players"]).toEqual([userId, secondUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: false,
                [secondUser]: true
            });
            // NOTE: this third condition isn't really possible in the order of events its' called, but can't hurt to be extra thorough
            testRoom["players"] = [userId, thirdUser];
            testRoom["playersOnline"][thirdUser] = false;
            expect(testRoom["players"]).toEqual([userId, thirdUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: false,
                [secondUser]: true,
                [thirdUser]: false
            });
            
            // make call
            testRoom["verifyOnlineObj"]();
            expect(testRoom["players"]).toEqual([userId, thirdUser]);
            expect(testRoom["playersOnline"]).toEqual({
                [userId]: false,
                [thirdUser]: false
            });
        });
     });

     it("setPlayerStatus should update playersOnline", () => {
        const userId = "test_user";        
        const secondUser = "test_second_user";   
        const testRoom = new GameRoom(userId);
        expect(testRoom['players']).toEqual([userId]);
        expect(testRoom['playersOnline']).toEqual({[userId]: true});
        testRoom.setPlayerStatus(userId, false);        
        expect(testRoom['playersOnline']).toEqual({[userId]: false});
        testRoom.setPlayerStatus(secondUser, false);        
        expect(testRoom['playersOnline']).toEqual({[userId]: false});
        testRoom.addPlayer(secondUser);
        expect(testRoom['playersOnline']).toEqual({[userId]: false, [secondUser]: true});
        testRoom.setPlayerStatus(userId, true);     
        testRoom.setPlayerStatus(secondUser, false); 
        expect(testRoom['playersOnline']).toEqual({[userId]: true, [secondUser]: false});  
     });

     it("setPlayerStatus returns true if it made changes", () => {
        const userId = "test_user";        
        const secondUser = "test_second_user";   
        const testRoom = new GameRoom(userId);
        expect(testRoom['players']).toEqual([userId]);
        expect(testRoom['playersOnline']).toEqual({[userId]: true});
        // changed current user
        expect(testRoom.setPlayerStatus(userId, false)).toBeTruthy();  
        // try changing current user to same value
        expect(testRoom.setPlayerStatus(userId, false)).toBeFalsy();
        // try changing a user that isn't in room
        expect(testRoom.setPlayerStatus(secondUser, false)).toBeFalsy();
        // add second user
        testRoom.addPlayer(secondUser);
        // try changing again
        expect(testRoom.setPlayerStatus(secondUser, false)).toBeTruthy();
        // set both users to true        
        expect(testRoom.setPlayerStatus(userId, true)).toBeTruthy();
        expect(testRoom.setPlayerStatus(secondUser, true)).toBeTruthy();
        // set to true again
        expect(testRoom.setPlayerStatus(userId, true)).toBeFalsy();
     });


     describe("addChatMessage", () => {
        it("will add a message to the chat array", () => {
            const userId = "test_user";
            const testRoom = new GameRoom(userId);
            // simple valid message
            const chatMsg: ChatDataI = {                
                roomId: testRoom.roomId,
                userId,
                msg: "test message"
            };
            testRoom.addChatMessage(chatMsg);
            expect(testRoom["chat"]).toEqual([chatMsg]);
        });

        it("will throw an error on invalid roomId", () => {
            const userId = "test_user";
            const testRoom = new GameRoom(userId);
            // simple valid message
            const chatMsg: ChatDataI = {                
                roomId: testRoom.roomId,
                userId,
                msg: "test message"
            };
            testRoom.addChatMessage(chatMsg);
            expect(testRoom["chat"]).toEqual([chatMsg]);

            // create a second room with a different room ID, knowing that it won't accept the same message
            const secondRoom = new GameRoom(userId);
            expect(secondRoom.roomId).not.toBe(testRoom.roomId);

            expect(() => {
                secondRoom.addChatMessage(chatMsg);
            }).toThrow("Tried adding a chat message to the wrong room.");
        });

        it("will throw an error if user isn't in the room", () => {
            const userId = "test_user";
            const secondUser = "test_second_user";   
            const testRoom = new GameRoom(userId);
            expect(testRoom["players"]).not.toContain(secondUser);
            // simple valid message
            const chatMsg: ChatDataI = {                
                roomId: testRoom.roomId,
                userId: secondUser,
                msg: "test message"
            };
            expect(() => {                
            testRoom.addChatMessage(chatMsg);
            }).toThrow("Message sent by user not in this room");
        });
     });
});