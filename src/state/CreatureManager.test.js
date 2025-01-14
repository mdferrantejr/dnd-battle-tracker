import {
  killCreature,
  stabalizeCreature,
  damageCreature,
  healCreature,
  createCreature,
  addNoteToCreature,
  updateNoteForCreature,
  removeNoteFromCreature,
  addHitPointsToCreature,
  addTemporaryHealthToCreature,
  validateCreature,
  addInitiativeToCreature,
  toggleCreatureLock,
  toggleCreatureShare,
  toggleCreatureHitPointsShare,
  resetCreature,
  getRawName,
  isCreatureStable,
} from './CreatureManager';
import { addCondition, removeCondition } from './ConditionsManager';
import defaultState from '../../test/fixtures/battle';

jest.mock('./ConditionsManager');

const unconsciousCondition = [{ text: 'Unconscious' }];

beforeEach(() => {
  jest.resetAllMocks();
  addCondition.mockReturnValue(unconsciousCondition);
  removeCondition.mockReturnValue([]);
});

describe('killCreature', () => {
  it('kills a creature and adds the unconscious condition', () => {
    const expected = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          alive: false,
          conditions: unconsciousCondition,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby killed/made unconscious'],
    };

    const result = killCreature(defaultState, 0);
    expect(result).toEqual(expected);
    expect(addCondition).toHaveBeenCalledTimes(1);
    expect(addCondition).toHaveBeenCalledWith('Unconscious', defaultState.creatures[0], 0);
  });

  it('kills a creature and sets its health points to 0 if it has them', () => {
    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          alive: false,
          healthPoints: 0,
          conditions: unconsciousCondition,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1 killed/made unconscious'],
    };

    const result = killCreature(defaultState, 1);
    expect(result).toEqual(expected);
  });
});

describe('stabalizeCreature', () => {
  it('stabalizes a creature who is dead with 0 hit points', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          alive: false,
          healthPoints: 0,
        },
        defaultState.creatures[2],
      ],
    };

    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          alive: true,
          healthPoints: 0,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1 stabalized'],
    };

    expect(stabalizeCreature(state, 1)).toEqual(expected);
  });

  it('stabalizes a creature who is dead with no hit points', () => {
    const state = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          alive: false,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
    };

    const expected = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          alive: true,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby stabalized'],
    };

    expect(stabalizeCreature(state, 0)).toEqual(expected);
  });

  it('stabalizes a creature who is already alive', () => {
    const expected = {
      ...defaultState,
      ariaAnnouncements: ['Wellby stabalized'],
    };
    expect(stabalizeCreature(defaultState, 0)).toEqual(expected);
  });
});

describe('damageCreature', () => {
  it('does nothing if a creature has no health points', () => {
    expect(damageCreature(defaultState, 0, 5)).toEqual(defaultState);
  });

  it('does nothing to an already dead creature without temporary health points', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        defaultState.creatures[1],
        {
          ...defaultState.creatures[2],
          healthPoints: 0,
          alive: false,
        },
      ],
    };

    expect(damageCreature(state, 2, 5)).toEqual(state);
  });

  it('does nothing to an already dead creature with 0 temporary health points', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        defaultState.creatures[1],
        {
          ...defaultState.creatures[2],
          healthPoints: 0,
          temporaryHealthPoints: 0,
          alive: false,
        },
      ],
    };

    expect(damageCreature(state, 2, 5)).toEqual(state);
  });

  it('does nothing if the damage is negative', () => {
    expect(damageCreature(defaultState, 1, -1)).toEqual(defaultState);
  });

  it('removes health points from a creature', () => {
    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        defaultState.creatures[1],
        {
          ...defaultState.creatures[2],
          healthPoints: 5,
        },
      ],
      ariaAnnouncements: ['damaged Goblin #2 by 5. Goblin #2\'s health is 5'],
    };

    expect(damageCreature(defaultState, 2, 5)).toEqual(expected);
  });

  it('removes temporary health points first', () => {
    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          temporaryHealthPoints: 5,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['damaged Goblin #1 by 5. Goblin #1\'s temporary health is 5. Goblin #1\'s health is 10'],
    };

    expect(damageCreature(defaultState, 1, 5)).toEqual(expected);
  });

  it('removes all temporary health points before health points', () => {
    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          temporaryHealthPoints: 0,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['damaged Goblin #1 by 10. Goblin #1\'s temporary health is 0. Goblin #1\'s health is 10'],
    };

    expect(damageCreature(defaultState, 1, 10)).toEqual(expected);
  });

  it('removes health points once temporary health points are down to 0', () => {
    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          temporaryHealthPoints: 0,
          healthPoints: 5,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['damaged Goblin #1 by 15. Goblin #1\'s temporary health is 0. Goblin #1\'s health is 5'],
    };

    expect(damageCreature(defaultState, 1, 15)).toEqual(expected);
  });

  it('removes health points if temporary health points are already 0', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          temporaryHealthPoints: 0,
        },
        defaultState.creatures[2],
      ],
    };

    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          temporaryHealthPoints: 0,
          healthPoints: 5,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['damaged Goblin #1 by 5. Goblin #1\'s temporary health is 0. Goblin #1\'s health is 5'],
    };

    expect(damageCreature(state, 1, 5)).toEqual(expected);
  });

  it('kills a creature with temporary health if enough damage is done', () => {
    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          temporaryHealthPoints: 0,
          healthPoints: 0,
          alive: false,
          conditions: unconsciousCondition,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['damaged Goblin #1 by 20. Goblin #1\'s temporary health is 0. Goblin #1\'s health is 0'],
    };

    expect(damageCreature(defaultState, 1, 20)).toEqual(expected);
  });

  it('removes temporary health points from an already dead creature', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 0,
          alive: false,
          conditions: unconsciousCondition,
        },
        defaultState.creatures[2],
      ],
    };

    const expected = {
      ...state,
      creatures: [
        state.creatures[0],
        {
          ...state.creatures[1],
          temporaryHealthPoints: 5,
        },
        state.creatures[2],
      ],
      ariaAnnouncements: ['damaged Goblin #1 by 5. Goblin #1\'s temporary health is 5. Goblin #1\'s health is 0'],
    };

    expect(damageCreature(state, 1, 5)).toEqual(expected);
  });

  it('kills a creature if it drops to 0 health points', () => {
    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        defaultState.creatures[1],
        {
          ...defaultState.creatures[2],
          healthPoints: 0,
          alive: false,
          conditions: unconsciousCondition,
        },
      ],
      ariaAnnouncements: ['damaged Goblin #2 by 10. Goblin #2\'s health is 0'],
    };

    expect(damageCreature(defaultState, 2, 10)).toEqual(expected);
  });

  it('kills a creature and sets its HP to 0 if it drops below 0 health points', () => {
    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        defaultState.creatures[1],
        {
          ...defaultState.creatures[2],
          healthPoints: 0,
          alive: false,
          conditions: unconsciousCondition,
        },
      ],
      ariaAnnouncements: ['damaged Goblin #2 by 100. Goblin #2\'s health is 0'],
    };

    expect(damageCreature(defaultState, 2, 100)).toEqual(expected);
  });
});

describe('healCreature', () => {
  it('does nothing if a creature has no health points', () => {
    expect(healCreature(defaultState, 0, 5)).toEqual(defaultState);
  });

  it('does nothing to a fully healed creature', () => {
    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['healed Goblin #1 by 5. Goblin #1\'s health is 10'],
    };
    expect(healCreature(defaultState, 1, 5)).toEqual(expectedState);
  });

  it('does nothing if the damage is negative', () => {
    expect(healCreature(defaultState, 1, -1)).toEqual(defaultState);
  });

  it('adds health points to a creature', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
        },
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['healed Goblin #1 by 5. Goblin #1\'s health is 10'],
    };

    expect(healCreature(state, 1, 5)).toEqual(expectedState);
  });

  it('does not exceed a creature\'s maximum health points', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
        },
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['healed Goblin #1 by 10. Goblin #1\'s health is 10'],
    };

    expect(healCreature(state, 1, 10)).toEqual(expectedState);
  });

  it('stabalizes a creature if it was dead and removes the unconscious condition', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 0,
          alive: false,
          conditions: unconsciousCondition,
        },
        defaultState.creatures[2],
      ],
    };

    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 1,
          alive: true,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['healed Goblin #1 by 1. Goblin #1\'s health is 1'],
    };

    expect(healCreature(state, 1, 1)).toEqual(expected);
    expect(removeCondition).toHaveBeenCalledTimes(1);
    expect(removeCondition).toHaveBeenCalledWith('Unconscious', state.creatures[1]);
  });

  it('heals a stable creature and removes the unconscious condition', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 0,
          conditions: unconsciousCondition,
        },
        defaultState.creatures[2],
      ],
    };

    const expected = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 1,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['healed Goblin #1 by 1. Goblin #1\'s health is 1'],
    };

    expect(healCreature(state, 1, 1)).toEqual(expected);
    expect(removeCondition).toHaveBeenCalledTimes(1);
    expect(removeCondition).toHaveBeenCalledWith('Unconscious', state.creatures[1]);
  });

  it('does not remove the unconscious condition if the creature was not dead', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
          conditions: unconsciousCondition,
        },
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          conditions: unconsciousCondition,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['healed Goblin #1 by 5. Goblin #1\'s health is 10'],
    };

    expect(healCreature(state, 1, 5)).toEqual(expectedState);
  });
});

describe('getRawName', () => {
  it('strips numbers and whitespace from the name', () => {
    const rawName = getRawName('name 1');
    expect(rawName).toBe('name');
  });

  it('strips hashes from the name', () => {
    const rawName = getRawName('name #1');
    expect(rawName).toBe('name');
  });
});

describe('createCreature', () => {
  test('it creates a new creature given a name, initiative and health points', () => {
    const expectedCreature = {
      name: 'name',
      initiative: 13,
      healthPoints: 10,
      maxHealthPoints: 10,
      temporaryHealthPoints: null,
      id: 1,
      alive: true,
      conditions: [],
      notes: [],
      locked: false,
      shared: true,
      hitPointsShared: true,
    };

    const creature = createCreature(1, { name: 'name', initiative: 13, healthPoints: 10 });
    expect(creature).toEqual(expectedCreature);
  });

  test('it creates a new creature given a name, initiative, health points and a number', () => {
    const expectedCreature = {
      name: 'name #3',
      initiative: 13,
      healthPoints: 10,
      maxHealthPoints: 10,
      temporaryHealthPoints: null,
      id: 1,
      alive: true,
      conditions: [],
      notes: [],
      locked: false,
      shared: true,
      hitPointsShared: true,
    };

    const creature = createCreature(1, {
      name: 'name', number: 3, initiative: 13, healthPoints: 10,
    });
    expect(creature).toEqual(expectedCreature);
  });
});

describe('validateCreature', () => {
  test('returns undefined if creature is valid', () => {
    expect(validateCreature('a', '1', 1, 1)).toEqual(undefined);
  });

  test.each([
    [undefined],
    [null],
  ])('initiative is optional: %p', (initiative) => {
    expect(validateCreature('a', initiative, 1, 1)).toEqual(undefined);
  });

  test('health is optional', () => {
    expect(validateCreature('a', '1', undefined, 1)).toEqual(undefined);
  });

  test('name must be non-empty', () => {
    const expectedErrors = {
      nameError: 'Name must be provided.',
      initiativeError: false,
      healthError: false,
      multiplierError: false,
    };
    expect(validateCreature('', '1', 1, 1)).toEqual(expectedErrors);
  });

  test.each([
    [NaN],
    ['a'],
    [new Error('initiative error')],
  ])('initiative must be a number if non-empty: %p', (initiative) => {
    const expectedErrors = {
      nameError: false,
      initiativeError: 'Initiative must be a number.',
      healthError: false,
      multiplierError: false,
    };
    expect(validateCreature('a', initiative, 1, 1)).toEqual(expectedErrors);
  });

  test('health must be greater than 0', () => {
    const expectedErrors = {
      nameError: false,
      initiativeError: false,
      healthError: 'Health must be greater than 0.',
      multiplierError: false,
    };
    expect(validateCreature('a', 1, 0, 1)).toEqual(expectedErrors);
  });

  test('multiplier must be greater than 0', () => {
    const expectedErrors = {
      nameError: false,
      initiativeError: false,
      healthError: false,
      multiplierError: 'Multiplier must be greater than 0 and less than 50.',
    };
    expect(validateCreature('a', 1, 1, 0)).toEqual(expectedErrors);
  });

  test('multiplier must be less than 51', () => {
    const expectedErrors = {
      nameError: false,
      initiativeError: false,
      healthError: false,
      multiplierError: 'Multiplier must be greater than 0 and less than 50.',
    };
    expect(validateCreature('a', 1, 1, 51)).toEqual(expectedErrors);
  });
});

describe('addNoteToCreature', () => {
  it('adds a note to a creature including an ID and application round and time', () => {
    const state = {
      ...defaultState,
      round: 2,
    };

    const result = addNoteToCreature(state, 1, 'some note', false);

    const expectedNote = {
      text: 'some note',
      appliedAtRound: 2,
      appliedAtSeconds: 6,
      id: 0,
    };

    const expectedState = {
      ...state,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [
            expectedNote,
          ],
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['note added to Goblin #1'],
    };
    expect(result).toEqual(expectedState);
  });

  it('increments the id based on the highest existing id when a note is added', () => {
    const note1 = {
      text: 'some note',
      appliedAtRound: 0,
      appliedAtSeconds: 0,
      id: 3,
    };
    const note2 = {
      text: 'some note',
      appliedAtRound: 0,
      appliedAtSeconds: 0,
      id: 4,
    };
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [note1, note2],
        },
        defaultState.creatures[2],
      ],
    };

    const result = addNoteToCreature(state, 1, 'some note', false);

    const expectedNote = {
      text: 'some note',
      appliedAtRound: 0,
      appliedAtSeconds: 0,
      id: 5,
    };

    const expectedState = {
      ...state,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [note1, note2, expectedNote],
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['note added to Goblin #1'],
    };
    expect(result).toEqual(expectedState);
  });

  it('increments the id regardless of the order of other notes', () => {
    const note1 = {
      text: 'some note',
      appliedAtRound: 0,
      appliedAtSeconds: 0,
      id: 3,
    };
    const note2 = {
      text: 'some note',
      appliedAtRound: 0,
      appliedAtSeconds: 0,
      id: 4,
    };
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [note2, note1],
        },
        defaultState.creatures[2],
      ],
    };

    const result = addNoteToCreature(state, 1, 'some note', false);

    const expectedNote = {
      text: 'some note',
      appliedAtRound: 0,
      appliedAtSeconds: 0,
      id: 5,
    };

    const expectedState = {
      ...state,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [note2, note1, expectedNote],
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['note added to Goblin #1'],
    };
    expect(result).toEqual(expectedState);
  });

  it('adds a note as a condition to a creature if isCondition is true', () => {
    const state = {
      ...defaultState,
      round: 2,
    };

    const result = addNoteToCreature(state, 1, 'Unconscious', true);

    const expectedState = {
      ...state,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          conditions: unconsciousCondition,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Unconscious condition added to Goblin #1'],
    };
    expect(result).toEqual(expectedState);
    expect(addCondition).toHaveBeenCalledTimes(1);
    expect(addCondition).toHaveBeenCalledWith('Unconscious', state.creatures[1], 2);
  });
});

describe('updateNoteForCreature', () => {
  it('updates a note without changing other notes', () => {
    const note1 = {
      text: 'some note',
      appliedAtRound: 2,
      appliedAtSeconds: 6,
      id: 0,
    };
    const note2 = {
      text: 'some note',
      appliedAtRound: 2,
      appliedAtSeconds: 6,
      id: 1,
    };
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [note1, note2],
        },
        defaultState.creatures[2],
      ],
    };

    const result = updateNoteForCreature(state, 1, 1, 'new value');

    const expectedNote = {
      ...note2,
      text: 'new value',
    };
    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [note1, expectedNote],
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['note updated for Goblin #1'],
    };
    expect(result).toEqual(expectedState);
  });

  it('does nothing if the note to be updated does not exist', () => {
    const result = updateNoteForCreature(defaultState, 1, 1, 'new value');
    expect(result).toEqual(defaultState);
  });

  it('does nothing if the creature to be updated does not exist', () => {
    const result = updateNoteForCreature(defaultState, 5, 1, 'new value');
    expect(result).toEqual(defaultState);
  });
});

describe('removeNoteFromCreature', () => {
  it('removes a note from a creature', () => {
    const note = {
      text: 'some note',
      appliedAtRound: 2,
      appliedAtSeconds: 6,
      id: 0,
    };
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [note],
        },
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['note removed from Goblin #1'],
    };

    const result = removeNoteFromCreature(state, 1, note, false);

    expect(result).toEqual(expectedState);
  });

  it('does not remove other notes with the same text as the one being removed', () => {
    const note = {
      text: 'some note',
      appliedAtRound: 2,
      appliedAtSeconds: 6,
      id: 0,
    };
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [
            {
              text: 'some note',
              appliedAtRound: 2,
              appliedAtSeconds: 6,
              id: 1,
            },
            note,
          ],
        },
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [
            {
              text: 'some note',
              appliedAtRound: 2,
              appliedAtSeconds: 6,
              id: 1,
            },
          ],
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['note removed from Goblin #1'],
    };

    const result = removeNoteFromCreature(state, 1, note, false);

    expect(result).toEqual(expectedState);
  });

  it('removes all notes with the same id from a creature', () => {
    const note = {
      text: 'some note',
      appliedAtRound: 2,
      appliedAtSeconds: 6,
      id: 0,
    };
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          notes: [
            note,
            note,
          ],
        },
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['note removed from Goblin #1'],
    };

    const result = removeNoteFromCreature(state, 1, note, false);

    expect(result).toEqual(expectedState);
  });

  it('removes a condition from a creature if isCondition is true', () => {
    const condition = {
      text: 'blinded',
      appliedAtRound: 2,
      appliedAtSeconds: 6,
    };

    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          conditions: [condition],
        },
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['blinded condition removed from Goblin #1'],
    };

    const result = removeNoteFromCreature(state, 1, condition, true);

    expect(result).toEqual(expectedState);
    expect(removeCondition).toHaveBeenCalledTimes(1);
    expect(removeCondition).toHaveBeenCalledWith(condition.text, state.creatures[1]);
  });
});

describe('addHitPointsToCreature', () => {
  it('adds hp to a creature that does not already have it', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          healthPoints: 10,
          maxHealthPoints: 10,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby\'s hp is 10, max hp is 10'],
    };

    const result = addHitPointsToCreature(defaultState, 0, 10);
    expect(result).toEqual(expectedState);
  });

  it('sets hp to 0 if creature is dead', () => {
    const state = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          alive: false,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...state,
      creatures: [
        {
          ...state.creatures[0],
          healthPoints: 0,
          maxHealthPoints: 10,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby\'s hp is 0, max hp is 10'],
    };

    const result = addHitPointsToCreature(state, 0, 10);
    expect(result).toEqual(expectedState);
  });

  it('updates a creature\'s hp if it is on full hp and the max hp increases', () => {
    const result = addHitPointsToCreature(defaultState, 1, 30);

    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 30,
          maxHealthPoints: 30,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1\'s hp is 30, max hp is 30'],
    };
    expect(result).toEqual(expectedState);
  });

  it('updates a creature\'s hp if it is on less than full hp and the max hp increases', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
        },
        defaultState.creatures[2],
      ],
    };

    const result = addHitPointsToCreature(state, 1, 20);

    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 15,
          maxHealthPoints: 20,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1\'s hp is 15, max hp is 20'],
    };
    expect(result).toEqual(expectedState);
  });

  it('updates a creature\'s hp if it is on full hp and the max hp decreases', () => {
    const result = addHitPointsToCreature(defaultState, 1, 5);

    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
          maxHealthPoints: 5,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1\'s hp is 5, max hp is 5'],
    };
    expect(result).toEqual(expectedState);
  });

  it('updates a creature\'s hp if it is on less than full hp and the max hp decreases below it', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
        },
        defaultState.creatures[2],
      ],
    };

    const result = addHitPointsToCreature(state, 1, 2);

    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 2,
          maxHealthPoints: 2,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1\'s hp is 2, max hp is 2'],
    };
    expect(result).toEqual(expectedState);
  });

  it('updates a creature\'s hp if it is on less than full hp and the max hp decreases whilst staying above it', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
        },
        defaultState.creatures[2],
      ],
    };

    const result = addHitPointsToCreature(state, 1, 7);

    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
          maxHealthPoints: 7,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1\'s hp is 5, max hp is 7'],
    };
    expect(result).toEqual(expectedState);
  });

  it('does nothing to a creature if it is on full hp and the max hp stays the same', () => {
    const result = addHitPointsToCreature(defaultState, 1, 10);

    const expectedState = {
      ...defaultState,
      ariaAnnouncements: ['Goblin #1\'s hp is 10, max hp is 10'],
    };
    expect(result).toEqual(expectedState);
  });

  it('does nothing to a creature if it is on less than full hp and the max hp stays the same', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          healthPoints: 5,
        },
        defaultState.creatures[2],
      ],
    };

    const result = addHitPointsToCreature(state, 1, 10);

    const expectedState = {
      ...state,
      ariaAnnouncements: ['Goblin #1\'s hp is 5, max hp is 10'],
    };
    expect(result).toEqual(expectedState);
  });

  it('does nothing to a creature if 0 hp is added', () => {
    const result = addHitPointsToCreature(defaultState, 0, 0);
    expect(result).toEqual(defaultState);
  });

  it('does nothing to a creature if less than 0 hp is added', () => {
    const result = addHitPointsToCreature(defaultState, 0, -1);
    expect(result).toEqual(defaultState);
  });
});

describe('addTemporaryHealthToCreature', () => {
  it('adds temporary health to a creature that does not already have it', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          temporaryHealthPoints: 10,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby has 10 temporary health points'],
    };

    const result = addTemporaryHealthToCreature(defaultState, 0, 10);
    expect(result).toEqual(expectedState);
  });

  it('overrides temporary health for a creature that already has it', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          temporaryHealthPoints: 20,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1 has 20 temporary health points'],
    };

    const result = addTemporaryHealthToCreature(defaultState, 1, 20);
    expect(result).toEqual(expectedState);
  });

  it('allows 0 temporary health to be added to a creature', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          temporaryHealthPoints: 0,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby has 0 temporary health points'],
    };

    const result = addTemporaryHealthToCreature(defaultState, 0, 0);
    expect(result).toEqual(expectedState);
  });

  it('does nothing to a creature if less than 0 health is added', () => {
    const result = addTemporaryHealthToCreature(defaultState, 0, -1);
    expect(result).toEqual(defaultState);
  });
});

describe('addInitiativeToCreature', () => {
  it('adds initiative to a creature that does not already have it', () => {
    const state = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          initiative: undefined,
        },
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          initiative: 10,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1\'s initiative is 10'],
    };

    const result = addInitiativeToCreature(state, 1, 10);
    expect(result).toEqual(expectedState);
  });

  it('does nothing to a creature that already has initiative', () => {
    const result = addInitiativeToCreature(defaultState, 1, 30);
    expect(result).toEqual(defaultState);
  });
});

describe('toggleCreatureLock', () => {
  it('locks a creature if it is unlocked', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          locked: true,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby is locked'],
    };

    const result = toggleCreatureLock(defaultState, 0);
    expect(result).toEqual(expectedState);
  });

  it('unlocks a creature if it is locked', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          locked: false,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1 is unlocked'],
    };

    const result = toggleCreatureLock(defaultState, 1);
    expect(result).toEqual(expectedState);
  });
});

describe('toggleCreatureShare', () => {
  it('enables creature share if it is disabled', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          shared: true,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1 is shared'],
    };

    const result = toggleCreatureShare(defaultState, 1);
    expect(result).toEqual(expectedState);
  });

  it('disables creature share if it is enabled', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          shared: false,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby is not shared'],
    };

    const result = toggleCreatureShare(defaultState, 0);
    expect(result).toEqual(expectedState);
  });
});

describe('toggleCreatureHitPointsShare', () => {
  it('enables creature hit points share if it is disabled', () => {
    const state = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          hitPointsShared: false,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
    };

    const expectedState = {
      ...defaultState,
      creatures: [
        {
          ...defaultState.creatures[0],
          hitPointsShared: true,
        },
        defaultState.creatures[1],
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Wellby\'s hit points are shared'],
    };

    const result = toggleCreatureHitPointsShare(state, 0);
    expect(result).toEqual(expectedState);
  });

  it('disables creature hit points share if it is enabled', () => {
    const expectedState = {
      ...defaultState,
      creatures: [
        defaultState.creatures[0],
        {
          ...defaultState.creatures[1],
          hitPointsShared: false,
        },
        defaultState.creatures[2],
      ],
      ariaAnnouncements: ['Goblin #1\'s hit points are not shared'],
    };

    const result = toggleCreatureHitPointsShare(defaultState, 1);
    expect(result).toEqual(expectedState);
  });
});

describe('resetCreatures', () => {
  it('resets a creature\'s id, initiative, notes and conditions', () => {
    const creature = {
      name: 'Goblin',
      healthPoints: 10,
      maxHealthPoints: 10,
      id: 1,
      alive: true,
      notes: [{ text: 'Exhaustion', appliedAtRound: 1, appliedAtSeconds: 6 }],
      conditions: [{
        text: 'Exhaustion', appliedAtRound: 1, appliedAtSeconds: 6, url: 'someurl',
      }],
      locked: true,
    };
    const expectedCreature = {
      ...creature,
      initiative: undefined,
      id: 0,
      notes: [{ text: 'Exhaustion', appliedAtRound: 0, appliedAtSeconds: 0 }],
      conditions: [{
        text: 'Exhaustion', appliedAtRound: 0, appliedAtSeconds: 0, url: 'someurl',
      }],
    };
    const result = resetCreature(0, creature);
    expect(result).toEqual(expectedCreature);
  });
});

describe('isCreatureStable', () => {
  it('returns true if the creature is alive on 0 HP', () => {
    const creature = {
      alive: true,
      healthPoints: 0,
      conditions: [],
    };

    expect(isCreatureStable(creature)).toBe(true);
  });

  it('returns true if the creature is alive without HP but is unconscious', () => {
    const creature = {
      alive: true,
      conditions: [{
        text: 'Unconscious',
      }],
    };

    expect(isCreatureStable(creature)).toBe(true);
  });

  it('returns false if the creature is alive but is unconscious', () => {
    const creature = {
      alive: true,
      healthPoints: 1,
      conditions: [{
        text: 'Unconscious',
      }],
    };

    expect(isCreatureStable(creature)).toBe(false);
  });

  it('returns false if the creature is alive and conscious', () => {
    const creature = {
      alive: true,
      healthPoints: 1,
      conditions: [],
    };

    expect(isCreatureStable(creature)).toBe(false);
  });

  it('returns false if the creature is alive without HP and conscious', () => {
    const creature = {
      alive: true,
      conditions: [],
    };

    expect(isCreatureStable(creature)).toBe(false);
  });

  it('returns false if the creature is dead', () => {
    const creature = {
      alive: false,
      healthPoints: 0,
      conditions: [],
    };

    expect(isCreatureStable(creature)).toBe(false);
  });
});
