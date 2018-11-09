pragma solidity ^0.4.20;

// ----------------------------------------------------------------------------
// Safe maths
// ----------------------------------------------------------------------------
library SafeMath {
    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }
    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }
    function mul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }
    function div(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}

// ----------------------------------------------------------------------------
// Owned contract
// ----------------------------------------------------------------------------
contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    function Owned() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}

//-----------------------------------------------------------------------------
//交易系统
//-----------------------------------------------------------------------------
contract TransactionSys{
    using SafeMath for uint;

    struct Pet {
        string PetName;
        string PetID;
        uint PetPrice;
    }

    mapping(address => Pet[]) userPets;
    event Transfer(address indexed from, address indexed to, Pet pet);

    //构造函数
    function TransactionSys() public {

    }

    // ------------------------------------------------------------------------
    // Get the pet balance for account `petOwner`
    // ------------------------------------------------------------------------
    function petsOf(address petOwner) public view returns (Pet[] pets) {
        return userPets[petOwner];
    }


    // ------------------------------------------------------------------------
    // Transfer the balance from pet owner's account to `to` account
    // - Owner's account must have sufficient balance to transfer
    // - 0 value transfers are allowed
    // ------------------------------------------------------------------------
    function transfer(address to, string petID) public returns (bool success) {
        Pet[] pets = userPets[msg.sender];
        for(var i=0; i<pets.length; i++){
            
        }
        if(.indexOf(pet) != -1) {//应该判断余额是否足够，不够则throw
            userPets[msg.sender] = userPets[msg.sender].push(pet);
            userPets[to] = userPets[to].push(pet);
            Transfer(msg.sender, to, pet);
            return true;
        } else {
            return false;
        }
        
    }

}


// ----------------------------------------------------------------------------
// 零之妖宠游戏合约
// ----------------------------------------------------------------------------
contract ZeroPet is Owned,TransactionSys {
    using SafeMath for uint;

    string public  _name;//合约名
    uint public _totalSupply;

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    function ZeroPet() public {
        _name = "ZeroPet";
        _totalSupply = 100000000;//宠物数量上限:一亿
    }

    function name() public view returns (string) {
        return _name;
    }

    // ------------------------------------------------------------------------
    // 宠物数量上限
    // ------------------------------------------------------------------------
    function totalSupply() public view returns (uint) {
        return _totalSupply;
    }

    // ------------------------------------------------------------------------
    // Don't accept ETH
    // ------------------------------------------------------------------------
    function () public payable {
        revert();
    }


}