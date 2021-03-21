module Calls exposing (..)

type alias CreateUserIn = { username : String }

type alias CreateUserOut = (Result ({ Success : True }) ({ Success : False, Reason : UsernameAlreadyUsed }))

type alias CheckUsernameIn = { username : String }

type alias CheckUsernameOut = { left: { Success : True }, right: { used : Bool } }

type alias GetAllUsernamesIn = {  }

type alias GetAllUsernamesOut = { left: { Success : True }, right: { usernames : (List string) } }

type alias SubscribeUsersIn = {  }

type alias SubscribeUsersOut = { left: { Success : True }, right: { feed_id : String } }

type alias CancelSubscribeIn = { feed_id : String }

type alias CancelSubscribeOut = { Success : True }
