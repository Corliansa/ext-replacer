const isObject = (target?: unknown): boolean => {
  /**
   * Check for:
   *  - undefined
   *  - null => would be an object type
   *  - false
   */
  if (!target) {
    return false;
  }

  /**
   * Check that the target is converted to an object
   * by the String constructor
   */
  if (String(target) !== "[object Object]") {
    return false;
  }

  /**
   * Probably an object
   */
  return true;
};

export type DeepPartial<T> = T extends Record<string, any>
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export const replacer = <
  T extends Record<string, any>,
  U extends DeepPartial<T> & Record<string, any>
>(
  obj: T,
  newValues: U,
  // replaceArrays mean that the old array will be fully replaced by the new array, else it will replace the values of the old array with the new values up to the length of the new array
  opts?: { replaceArrays?: boolean }
): T & U => {
  // Create a new object that will hold the updated values
  const updatedObj = { ...obj };

  // Loop through the properties of the newValues object
  for (const prop in newValues) {
    // Check if the property exists in the original object
    if (prop in obj) {
      // Check if the property value is an object
      if (obj[prop] && isObject(obj[prop]) && isObject(newValues[prop])) {
        if (Array.isArray(obj[prop]) && Array.isArray(newValues[prop])) {
          // If the property value is an array, update the property value with the new value
          if (opts?.replaceArrays) {
            (updatedObj[prop] as any) = newValues[prop];
          } else {
            for (let i = 0; i < newValues[prop].length; i++) {
              updatedObj[prop][i] =
                isObject(obj[prop][i]) && isObject(newValues[prop][i])
                  ? replacer(obj[prop][i], newValues[prop][i])
                  : newValues[prop][i];
            }
          }
        } else {
          // If the property value is an object, recursively call the replacer function
          updatedObj[prop] = replacer(obj[prop], newValues[prop]);
        }
      } else {
        // If the property value is not an object, update the property value with the new value
        (updatedObj[prop] as any) = newValues[prop];
      }
    } else {
      // If the property doesn't exist in the original object, add it
      (updatedObj[prop] as any) = newValues[prop];
    }
  }

  // Return the updated object
  return updatedObj as T & U;
};
