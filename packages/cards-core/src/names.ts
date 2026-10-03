import type { Card, Rank, Suit } from './cards';

const RANK_NAMES: Record<Rank, string> = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', '10': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven', '6': 'Six',
  '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two',
};

/** A suit's name, in the plural: "spades". */
export const SUIT_NAMES: Record<Suit, string> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };

/** A card in words: "Queen of spades". */
export const cardName = (card: Card): string => `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;

/** A card played, for screen readers: "You play the two of clubs. ", "Grace plays the ace of spades. " */
export function playedText(who: { readonly human: boolean; readonly name: string } | undefined, card: Card): string {
  return `${!who || who.human ? 'You play' : `${who.name} plays`} the ${cardName(card).toLowerCase()}. `;
}
