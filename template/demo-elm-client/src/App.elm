module App exposing (..)

import Browser exposing (UrlRequest)
import Browser.Navigation
import Html exposing (button, div, input, label, text)
import Html.Events exposing (onClick, onInput)
import Http exposing (Error)
import Json.Decode as Decode
import Json.Encode as Encode
import Url


main : Program () Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlChange = onUrlChange
        , onUrlRequest = onUrlRequest
        }


type alias Model =
    { username : String
    , used : Maybe Bool
    }


init : flags -> Url.Url -> Browser.Navigation.Key -> ( Model, Cmd Msg )
init _ _ _ =
    ( { username = "", used = Nothing }, Cmd.none )


type Msg
    = Todo
    | SetUsername String
    | Call
    | SetUsed (Result Error Used)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Todo ->
            ( model, Cmd.none )

        SetUsername key ->
            ( { model | username = key }, Cmd.none )

        SetUsed result ->
            case result of
                Err err ->
                    ( model, Cmd.none )

                Ok { used } ->
                    ( { model | used = Just used }, Cmd.none )

        Call ->
            ( model, call )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none


view : Model -> Browser.Document Msg
view model =
    { title = "Elm App"
    , body =
        [ label [] [ text "username" ]
        , input [ onInput SetUsername ] []
        , div [] [ button [ onClick Call ] [ text "Create User" ] ]
        , label [] [ text "result" ]
        , div [] [ viewUsed model.used ]
        ]
    }


viewUsed : Maybe Bool -> Html.Html msg
viewUsed maybeUsed =
    case maybeUsed of
        Nothing ->
            text ""

        Just used ->
            text
                (if used then
                    "Used"

                 else
                    "Not Used"
                )


onUrlRequest : UrlRequest -> Msg
onUrlRequest urlRequest =
    Todo


onUrlChange : Url.Url -> Msg
onUrlChange url =
    Todo


type alias Used =
    { success : Bool, used : Bool }


call =
    Http.post
        { url = "http://localhost:3000/core/Call"
        , body =
            Http.jsonBody <|
                Encode.object
                    [ ( "Type", Encode.string "CheckUsername" )
                    , ( "In"
                      , Encode.object
                            [ ( "username", Encode.string "alice" )
                            ]
                      )
                    ]
        , expect =
            Http.expectJson SetUsed <|
                Decode.map2 Used
                    (Decode.field "Success" Decode.bool)
                    (Decode.field "used" Decode.bool)
        }
