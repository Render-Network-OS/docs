/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/rewards_record.json`.
 */
export type RewardsRecord = {
  "address": "ficrNNa5WqdR21xPwAagh44Vo4f81z7E1pN8y9Q6vSq",
  "metadata": {
    "name": "rewardsRecord",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "claimReward",
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "airdropEpoch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "claimReceipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  105,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "airdropEpoch"
              },
              {
                "kind": "account",
                "path": "recipient"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "recipientUsdcAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipient"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "epochId",
          "type": "u64"
        },
        {
          "name": "points",
          "type": "u64"
        },
        {
          "name": "usdcAmount",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        }
      ]
    },
    {
      "name": "commitEpoch",
      "discriminator": [
        140,
        0,
        62,
        186,
        73,
        180,
        201,
        179
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "airdropEpoch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "epochId",
          "type": "u64"
        },
        {
          "name": "usdCents",
          "type": "u64"
        },
        {
          "name": "usdcAmount",
          "type": "u64"
        },
        {
          "name": "totalPoints",
          "type": "u64"
        },
        {
          "name": "recipients",
          "type": "u32"
        },
        {
          "name": "root",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "fundVault",
      "discriminator": [
        26,
        33,
        207,
        242,
        119,
        108,
        134,
        73
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "airdropEpoch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "authorityUsdcAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "vault"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "epochId",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initConfig",
      "discriminator": [
        23,
        235,
        115,
        232,
        168,
        96,
        1,
        231
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "recordAirdrop",
      "discriminator": [
        52,
        247,
        228,
        42,
        219,
        166,
        148,
        99
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "airdropEpoch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  105,
                  114,
                  100,
                  114,
                  111,
                  112
                ]
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "epochId",
          "type": "u64"
        },
        {
          "name": "usdCents",
          "type": "u64"
        },
        {
          "name": "usdcAmount",
          "type": "u64"
        },
        {
          "name": "totalPoints",
          "type": "u64"
        },
        {
          "name": "recipients",
          "type": "u32"
        },
        {
          "name": "root",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "airdropEpoch",
      "discriminator": [
        72,
        144,
        130,
        9,
        127,
        60,
        59,
        190
      ]
    },
    {
      "name": "claimReceipt",
      "discriminator": [
        223,
        233,
        11,
        229,
        124,
        165,
        207,
        28
      ]
    },
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "events": [
    {
      "name": "epochCommitted",
      "discriminator": [
        165,
        83,
        91,
        255,
        184,
        39,
        148,
        50
      ]
    },
    {
      "name": "rewardClaimed",
      "discriminator": [
        49,
        28,
        87,
        84,
        158,
        48,
        229,
        175
      ]
    },
    {
      "name": "vaultFunded",
      "discriminator": [
        192,
        119,
        245,
        193,
        55,
        223,
        195,
        50
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6001,
      "name": "insufficientVault",
      "msg": "Vault balance insufficient"
    },
    {
      "code": 6002,
      "name": "merkleVerificationFailed",
      "msg": "Merkle proof verification failed"
    },
    {
      "code": 6003,
      "name": "arithmeticOverflow",
      "msg": "Math overflow"
    }
  ],
  "types": [
    {
      "name": "airdropEpoch",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "usdCents",
            "type": "u64"
          },
          {
            "name": "usdcAmount",
            "type": "u64"
          },
          {
            "name": "totalPoints",
            "type": "u64"
          },
          {
            "name": "recipients",
            "type": "u32"
          },
          {
            "name": "root",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "ts",
            "type": "i64"
          },
          {
            "name": "totalFunded",
            "type": "u64"
          },
          {
            "name": "totalClaimed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "claimReceipt",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "claimedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "epochCommitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "usdCents",
            "type": "u64"
          },
          {
            "name": "usdcAmount",
            "type": "u64"
          },
          {
            "name": "totalPoints",
            "type": "u64"
          },
          {
            "name": "recipients",
            "type": "u32"
          },
          {
            "name": "root",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "rewardClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "usdcAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vaultFunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
