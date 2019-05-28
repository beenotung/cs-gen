## TODO
- [ ] gen typed methods for client side, not just generic call()

because otherwise, may need to type cast every time,
e.g. `l.call<T>({Type:'T',In:...})`
into `l.T(...)`
