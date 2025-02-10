export type SolanaEvent = {
    "address":"",
    "metadata": {
        "name": "common",
        "version": "0.1.0",
        "spec": "0.1.0",
        "description": "Created with Anchor"
    },
    "instructions":[],
    "events": [
        {
            "name": "AddTopEvent",
            "discriminator": [
                109,
                137,
                9,
                52,
                46,
                31,
                222,
                222
            ]

        },
        {
            "name": "AddWithdrawEvent",
            "discriminator": [
                142,
                251,
                35,
                225,
                101,
                233,
                44,
                252
            ]

        },
        {
            "name": "InviteAddEvent",
            "discriminator": [
                69,
                164,
                186,
                93,
                34,
                0,
                130,
                125
            ]
        },
        {
            "name": "RegisterEvent",
            "discriminator": [
                11,
                129,
                9,
                89,
                78,
                136,
                194,
                135
            ]

        },
        {
            "name": "ShareAddEvent",
            "discriminator": [
                248,
                65,
                106,
                248,
                207,
                25,
                160,
                160
            ]
        },
        {
            "name": "WithdrawEvent",
            "discriminator": [
                22,
                9,
                133,
                26,
                160,
                44,
                71,
                192
            ]

        },
        {
            "name": "WithdrawTokenEvent",
            "discriminator": [
                24,
                143,
                204,
                34,
                192,
                127,
                217,
                220
            ]

        },
        {
            "name": "SuccessRebateEvent",
            "discriminator": [189, 87, 174, 121, 37, 177, 47, 216]
        },
        {
            "name": "RaydiumBaseInEvent",
            "discriminator": [184, 7, 91, 29, 7, 195, 38, 13]
        },
        {
            "name": "RaydiumBaseOutEvent",
            "discriminator": [200, 13, 30, 25, 74, 181, 188, 117]
        },
        {
            "name": "PumpfunCreateEvent",
            "discriminator": [145, 204, 210, 138, 98, 8, 235, 167]
        },
        {
            "name": "PumpfunBuyEvent",
            "discriminator":[252, 88, 169, 123, 221, 80, 207, 185]
        },
        {
            "name": "PumpfunSellEvent",
            "discriminator": [246, 42, 24, 132, 21, 8, 46, 140]
        },
        {
          "name": "CompleteEvent",
          "discriminator": [
            95,
            114,
            97,
            156,
            212,
            46,
            152,
            8
          ]
        },
    ],
    "types": [
        {
            "name": "EventRebateType",
            "repr": {
                "kind": "rust"
            },
            "type": {
                "kind": "enum",
                "variants": [
                    {
                        "name": "FirstRebate"
                    },
                    {
                        "name": "SecondRebate"
                    },
                    {
                        "name": "ThirdRebate"
                    },
                    {
                        "name": "OneTimeRebate"
                    }
                ]
            }
        },
        {
            "name": "RaydiumBaseInEvent",
            "type": {
              "kind": "struct",
              "fields": [
                {
                  "name": "id",
                  "type": "u8"
                },
                {
                  "name": "tg_id",
                  "type": {
                    "option": "u64"
                  }
                },
                {
                  "name": "mint_a",
                  "type": "pubkey"
                },
                {
                  "name": "mint_b",
                  "type": "pubkey"
                },
                {
                  "name": "fee_rate",
                  "type": "u64"
                },
                {
                  "name": "amount_in",
                  "type": "u64"
                },
                {
                  "name": "amount_out",
                  "type": "u64"
                },
                {
                  "name": "user",
                  "type": "pubkey"
                },
                {
                  "name": "trade_at",
                  "type": "u64"
                }
              ]
            }
          },
          {
            "name": "RaydiumBaseOutEvent",
            "type": {
              "kind": "struct",
              "fields": [
                {
                  "name": "id",
                  "type": "u8"
                },
                {
                  "name": "tg_id",
                  "type": {
                    "option": "u64"
                  }
                },
                {
                  "name": "mint_a",
                  "type": "pubkey"
                },
                {
                  "name": "mint_b",
                  "type": "pubkey"
                },
                {
                  "name": "fee_rate",
                  "type": "u64"
                },
                {
                  "name": "amount_in",
                  "type": "u64"
                },
                {
                  "name": "amount_out",
                  "type": "u64"
                },
                {
                  "name": "user",
                  "type": "pubkey"
                },
                {
                  "name": "trade_at",
                  "type": "u64"
                }
              ]
            }
          },
        {
            "name": "SuccessRebateEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    },
                    {
                        "name": "rebate_type",
                        "type": {
                            "defined": {
                                "name": "EventRebateType"
                            }
                        }
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    },
                    {
                        "name": "mint",
                        "type": {
                            "option": "pubkey"
                        }
                    }
                ]
            }
        },
        {
            "name": "AddTopEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    },
                    {
                        "name": "top_id",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "AddWithdrawEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    },
                    {
                        "name": "withdraw_address",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "CreateOneTimeRebateEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    },
                    {
                        "name": "one_time_nonce",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "CreateOneTimeRebateParams",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "tg_id",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "OneTimeRebate",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "owner_rebate_person",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "RebatePerson",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "top",
                        "type": {
                            "option": "pubkey"
                        }
                    },
                    {
                        "name": "tgid",
                        "type": "u64"
                    },
                    {
                        "name": "withdraw_authority",
                        "type": {
                            "option": "pubkey"
                        }
                    },
                    {
                        "name": "one_time_nonce",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "RebateState",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "opeater_authority",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "RegisterEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "TgData",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "tgid",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "WithdrawEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    },
                    {
                        "name": "withdraw_address",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "WithdrawTokenEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    },
                    {
                        "name": "withdraw_address",
                        "type": "pubkey"
                    },
                    {
                        "name": "mint_address",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "PumpfunBuyEvent",
            "type": {
              "kind": "struct",
              "fields": [
                {
                  "name": "id",
                  "type": "u8"
                },
                {
                  "name": "mint",
                  "type": "pubkey"
                },
                {
                  "name": "user",
                  "type": "pubkey"
                },
                {
                  "name": "tg_id",
                  "type": {
                    "option": "u64"
                  }
                },
                {
                  "name": "amount",
                  "type": "u64"
                },
                {
                  "name": "sol_amount",
                  "type": "u64"
                },
                {
                  "name": "fee_rate",
                  "type": "u64"
                },
                {
                  "name": "timestamp",
                  "type": "u64"
                }
              ]
            }
          },
          {
            "name": "PumpfunCreateEvent",
            "type": {
              "kind": "struct",
              "fields": [
                {
                  "name": "id",
                  "type": "u8"
                },
                {
                  "name": "tg_id",
                  "type": {
                    "option": "u64"
                  }
                },
                {
                  "name": "mint",
                  "type": "pubkey"
                },
                {
                  "name": "user",
                  "type": "pubkey"
                },
                {
                  "name": "name",
                  "type": "string"
                },
                {
                  "name": "symbol",
                  "type": "string"
                },
                {
                  "name": "uri",
                  "type": "string"
                },
                {
                  "name": "create_fee",
                  "type": "u64"
                },
                {
                  "name": "timestamp",
                  "type": "u64"
                }
              ]
            }
          },
          {
            "name": "PumpfunSellEvent",
            "type": {
              "kind": "struct",
              "fields": [
                {
                  "name": "id",
                  "type": "u8"
                },
                {
                  "name": "mint",
                  "type": "pubkey"
                },
                {
                  "name": "user",
                  "type": "pubkey"
                },
                {
                  "name": "tg_id",
                  "type": {
                    "option": "u64"
                  }
                },
                {
                  "name": "amount",
                  "type": "u64"
                },
                {
                  "name": "sol_amount",
                  "type": "u64"
                },
                {
                  "name": "fee_rate",
                  "type": "u64"
                },
                {
                  "name": "timestamp",
                  "type": "u64"
                }
              ]
            }
          },
          {
            "name": "CompleteEvent",
            "type": {
              "kind": "struct",
              "fields": [
                {
                  "name": "user",
                  "type": "pubkey"
                },
                {
                  "name": "mint",
                  "type": "pubkey"
                },
                {
                  "name": "bonding_curve",
                  "type": "pubkey"
                },
                {
                  "name": "timestamp",
                  "type": "i64"
                }
              ]
            }
          },
          {
            "name": "JupiterSwapEvent",
            "type": {
              "kind": "struct",
              "fields": [
                {
                  "name": "id",
                  "type": "u8"
                },
                {
                  "name": "from_mint",
                  "type": "pubkey"
                },
                {
                  "name": "to_mint",
                  "type": "pubkey"
                },
                {
                  "name": "user",
                  "type": "pubkey"
                },
                {
                  "name": "tg_id",
                  "type": {
                    "option": "u64"
                  }
                },
                {
                  "name": "amount_in",
                  "type": "u64"
                },
                {
                  "name": "amount_out",
                  "type": "u64"
                },
                {
                  "name": "fee_rate",
                  "type": "u64"
                },
                {
                  "name": "timestamp",
                  "type": "u64"
                }
              ]
            }
          },
        {
            "name": "ShareAddEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    },
                    {
                        "name": "share_num",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "InviteAddEvent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "id",
                        "type": "u8"
                    },
                    {
                        "name": "tg_id",
                        "type": "u64"
                    },
                    {
                        "name": "invite_num",
                        "type": "u64"
                    }
                ]
            }
        }
    ]
}

