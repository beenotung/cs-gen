module Calls exposing (..)

type alias CheckUsernameIn =
    { username:String
    }


type alias CheckUsernameOut =
    { success : Bool
    , used : Bool
    }
