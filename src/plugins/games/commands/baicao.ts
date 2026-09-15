import { Command, CommandContext } from '../../../core/context.js';
import { fmt } from '../../shared/data-store.js';

export interface Card {
  value: string;
  suit: string;
  suitIcon: string;
  weight: number;
  rank: number;
}

const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = [
  { name: 'spades', icon: '♠' },
  { name: 'clubs', icon: '♣' },
  { name: 'diamonds', icon: '♦' },
  { name: 'hearts', icon: '♥' }
];

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (let r = 0; r < VALUES.length; r++) {
    const val = VALUES[r];
    let weight = r + 1; // A = 1, 2-10, J/Q/K = 10
    if (['J', 'Q', 'K'].includes(val)) weight = 10;
    for (const suit of SUITS) {
      deck.push({
        value: val,
        suit: suit.name,
        suitIcon: suit.icon,
        weight,
        rank: r + 1 // 1 to 13
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export interface HandResult {
  cards: Card[];
  type: 'SAP' | 'BATAY' | 'DIEM';
  score: number; // 0-9 for DIEM, or rank for SAP
  label: string;
}

export function evaluateHand(cards: Card[]): HandResult {
  // Check Sáp: 3 cards same rank
  if (cards[0].value === cards[1].value && cards[1].value === cards[2].value) {
    return {
      cards,
      type: 'SAP',
      score: cards[0].rank,
      label: `Sáp ${cards[0].value}`
    };
  }

  // Check Ba Tây: all 3 are J, Q, or K
  const isFace = (c: Card) => ['J', 'Q', 'K'].includes(c.value);
  if (isFace(cards[0]) && isFace(cards[1]) && isFace(cards[2])) {
    return {
      cards,
      type: 'BATAY',
      score: 10,
      label: 'Ba Tây (Ba Cào)'
    };
  }

  // Điểm thường
  const sum = cards.reduce((acc, c) => acc + c.weight, 0);
  const mod = sum % 10;
  return {
    cards,
    type: 'DIEM',
    score: mod,
    label: mod === 0 ? 'Bù (0 nút)' : `${mod} nút`
  };
}

export function compareHands(player: HandResult, dealer: HandResult): number {
  // Priority: SAP > BATAY > DIEM
  const typeWeight = { SAP: 3, BATAY: 2, DIEM: 1 };
  if (typeWeight[player.type] > typeWeight[dealer.type]) return 1;
  if (typeWeight[player.type] < typeWeight[dealer.type]) return -1;

  if (player.type === 'SAP') {
    return player.score > dealer.score ? 1 : player.score < dealer.score ? -1 : 0;
  }
  if (player.type === 'BATAY') {
    return 0; // Draw between 2 Ba Tây
  }
  // DIEM: compare score
  if (player.score > dealer.score) return 1;
  if (player.score < dealer.score) return -1;
  return 0;
}

function fmtHand(cards: Card[]): string {
  return cards.map((c) => `[${c.value}${c.suitIcon}]`).join(' ');
}

export const baicaoCommand: Command = {
  name: 'baicao',
  aliases: ['3cay', 'bai3la'],
  description: 'Chơi bài cào 3 lá với nhà cái',
  usage: '!baicao <tiền cược|all>',
  category: 'games',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    if (!userRepo) {
      await ctx.reply('⚠️ Hệ thống tiền tệ chưa sẵn sàng.');
      return;
    }

    const currentBalance = await userRepo.getBalance(ctx.userId);
    const betArg = ctx.args[0] || '100';

    let bet = 0;
    if (betArg.toLowerCase() === 'all') {
      bet = currentBalance;
    } else {
      bet = parseInt(betArg, 10);
    }

    if (isNaN(bet) || bet < 50) {
      await ctx.reply('⚠️ Tiền cược tối thiểu là 50$. Cú pháp: `!baicao <tiền cược>`');
      return;
    }

    if (currentBalance < bet) {
      await ctx.reply(`⚠️ Bạn không đủ tiền cược. Số dư hiện có: ${fmt(currentBalance)}$`);
      return;
    }

    const deck = shuffleDeck(buildDeck());
    const playerCards = [deck[0], deck[1], deck[2]];
    const dealerCards = [deck[3], deck[4], deck[5]];

    const playerHand = evaluateHand(playerCards);
    const dealerHand = evaluateHand(dealerCards);

    const cmp = compareHands(playerHand, dealerHand);

    let resultMsg = '';
    let newBalance = currentBalance;

    if (cmp > 0) {
      newBalance = await userRepo.updateBalance(ctx.userId, bet);
      resultMsg = `🎉 BẠN THẮNG! (+${fmt(bet)}$)`;
    } else if (cmp < 0) {
      newBalance = await userRepo.updateBalance(ctx.userId, -bet);
      resultMsg = `💀 BẠN THUA! (-${fmt(bet)}$)`;
    } else {
      resultMsg = `🤝 HÒA! (Giữ nguyên tiền)`;
    }

    await ctx.reply(
      [
        '🃏 BÀI CÀO 3 LÁ 🃏',
        `👤 Bạn: ${fmtHand(playerCards)} ➔ ${playerHand.label}`,
        `🤖 Nhà Cái: ${fmtHand(dealerCards)} ➔ ${dealerHand.label}`,
        '',
        resultMsg,
        `💰 Số dư hiện tại: ${fmt(newBalance)}$`
      ].join('\n')
    );
  }
};
